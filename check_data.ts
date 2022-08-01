import { appendFile, stat, readFile, readdir } from "fs/promises";
import { execSync } from "child_process";

const dateFormat = (date: Date, fstr: string) => {
	return fstr.replace(/%[YmdHMS]/g, (m: string) => {
		switch (m) {
			case "%Y":
				return date.getUTCFullYear().toString(); // no leading zeros required
			case "%m":
				m = 1 + date.getUTCMonth().toString();
				break;
			case "%d":
				m = date.getUTCDate().toString();
				break;
			case "%H":
				m = date.getUTCHours().toString();
				break;
			case "%M":
				m = date.getUTCMinutes().toString();
				break;
			case "%S":
				m = date.getUTCSeconds().toString();
				break;
			default:
				return m.slice(1); // unknown code, remove %
		}
		// add leading zero if required
		return ("0" + m).slice(-2);
	});
};

const log = async (str: string) => {
	process.stdout.write(str);
	await appendFile("./Resources/status_check_log.txt", `\n${new Date().toString()} - ${str}`).catch((err) =>
		log(`\n An unexpected error occurred while checking status! ${err} \n\n`)
	);
};

const checkCom = async (com: string) => {
	const comIssue = `Issues were found with ${com}. Record the issue and refer to the Trial Instructions.\n`;
	await log(`Checking data is being logged from: ${com}...\n`);
	const file = dateFormat(new Date(), `C:\\DataLog\\_${com}\\${com}-data%Y%m%d%H.log`);
	try {
		const COM = await stat(file);
		const timeOld = COM.mtime.getTime() - new Date().getTime();
		if (timeOld > 1 * 60 * 1000) {
			await ERROR(`[ref 1.1] ${com} datalog file has not been updated in the last minute.`);
			await ERROR(comIssue);
		} else {
			const COMData = (await readFile(file)).toString().split("\n");
			await GREEN(
				`No issues found with ${com}. Here are the latest 20 lines to check if sensible data is being logged.\nRefer to Trial Instructions (Annex A) for examples: \n\n`
			);
			await log(`${COMData.slice(COMData.length - 20, COMData.length).join("\n")}\n`);
		}
	} catch (err) {
		await ERROR(`[ref 1.2] ${file} datalog file does not exist!`);
		await ERROR(comIssue);
	}
	await continu();
};

const ERROR = async (info: string) => log(`\u001b[37m\u001b[1m\u001b[41mERROR DETECTED!\u001b[0m ${info}\n`);
const WARN = async (info: string) => log(`\u001b[43m\u001b[37m\u001b[1mWARNING:\u001b[0m ${info}\n`);
const GREEN = async (info: string) => log(`\u001b[1m\u001b[37m\u001b[42;1m${info}\u001b[0m`);

const serviceRunning = (serviceName: string) => execSync(`sc query ${serviceName}`).toString().indexOf(`RUNNING`) > -1;
const startService = async (serviceName: string) => execSync(`net start ${serviceName}`).toString();

const checkService = async (serviceName) => {
	if (!serviceRunning(serviceName)) {
		await WARN(`Service ${serviceName} was not running... Attempting to restart...`);
		await startService(serviceName).catch(() => {});
		if (!serviceRunning(serviceName)) await ERROR(`[ref 2.1] Service ${serviceName} is not running! Failed to automatically restart!`);
		else await WARN(`Service ${serviceName} restarted successfully!`);
		return true;
	}
	return false;
};

const keypress = () => {
	process.stdin.setRawMode(true);
	return new Promise((res) =>
		process.stdin.once("data", () => {
			process.stdin.setRawMode(false);
			res(null);
		})
	);
};

const continu = async () => {
	await log(`Press any key to continue...\n`);
	await keypress();
	console.clear();
};

const checkStatus = async () => {
	await log(`\nChecking that all services are running...\n\n\n`);

	// Check Tardis
	const tardisStatus = await checkService("Tardis");

	// Check NPort
	const nPortStatus = await checkService("npsrcsvr");

	// Check Advanced NMEA Data Logger
	const advNMEADataLoggerStatus = await checkService("AdvNMEADataLogger");

	if (!tardisStatus && !nPortStatus && !advNMEADataLoggerStatus) await GREEN("No issues found... All services working normally.\n\n");
	else await ERROR(`Issues were found. Record the issue and refer to the Trial Instructions if service did not restart\n\n`);

	await continu();

	await checkCom(`COM1`);
	await checkCom(`COM3`);
	await checkCom(`COM4`);
	await checkCom(`COM10`);

	await log(`Checking the data log backups...\n`);
	const backupIssues = `Issues were found. Record the issue and refer to the Trial Instructions.\n\n`;
	try {
		const latestBackup = (await readdir(`D:\\`)).slice(1).reduce((latest, backup) => {
			// 2020.11.30-00.43.25
			backup = backup.slice(16);
			const year = +backup.slice(0, 4);
			const month = +backup.slice(5, 7) - 1;
			const day = +backup.slice(8, 10);

			const hour = +backup.slice(11, 13);
			const minute = +backup.slice(14, 16);
			const second = +backup.slice(17, 19);

			const backupAge = Date.now() - new Date(year, month, day, hour, minute, second).getTime();
			if (latest > backupAge) return backupAge;
		}, Number.MAX_SAFE_INTEGER);

		const _24Hours = 24 * 60 * 60 * 1000;
		if (latestBackup > _24Hours) {
			await ERROR(`[ref 3.1] A backup has not occurred in the last 24 hours!`);
			await ERROR(backupIssues);
		} else await GREEN("No issues found... Backups working normally.\n\n");
	} catch (err) {
		await ERROR(`[ref 3.2] Backup USB not connected!`);
		await ERROR(backupIssues);
	}

	await continu();
	process.exit(0);
};
checkStatus().catch(async (err) => {
	await log(`\n An unexpected error occurred while checking status! ${err} \n\n`);
	await continu();
	process.exit(0);
});
