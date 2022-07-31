
const dateFormat = (date, fstr) => {
	return fstr.replace(/%[YmdHMS]/g, function (m) {
		switch (m) {
			case "%Y":
				return date["getUTCFullYear"](); // no leading zeros required
			case "%m":
				m = 1 + date["getUTCMonth"]();
				break;
			case "%d":
				m = date["getUTCDate"]();
				break;
			case "%H":
				m = date["getUTCHours"]();
				break;
			case "%M":
				m = date["getUTCMinutes"]();
				break;
			case "%S":
				m = date["getUTCSeconds"]();
				break;
			default:
				return m.slice(1); // unknown code, remove %
		}
		// add leading zero if required
		return ("0" + m).slice(-2);
	});
};

const fs = require('fs').promises;
const { execSync } = require('child_process')

const log = str => process.stdout.write(str) && fs.appendFile('./Resources/status_check_log.txt', `\n${new Date().toString()} - ${str}`).catch(err => log(`\n An unexpected error occurred while checking status! ${err} \n\n`))


const checkCom = async com => {
	const comIssue =  `Issues were found with ${com}. Record the issue and refer to the Trial Instructions.\n`
	log(`Checking data is being logged from: ${com}...\n`)
	const file = dateFormat(new Date(), `C:\\DataLog\\_${com}\\${com}-data%Y%m%d%H.log`)
	try {
		const COM = await fs.stat(file)
		const timeOld = COM.mtime.getTime() - new Date().getTime()
		if (timeOld > 1*60*1000) {
			ERROR(`[ref 1.1] ${com} datalog file has not been updated in the last minute.`)
			ERROR(comIssue)
		} else {
			const COMData = (await fs.readFile(file)).toString().split('\n')
			GREEN(`No issues found with ${com}. Here are the latest 20 lines to check if sensible data is being logged.\nRefer to Trial Instructions (Annex A) for examples: \n\n`)
			log(`${COMData.slice(COMData.length-20, COMData.length).join('\n')}\n`)
		}
	} catch (err) {
		ERROR(`[ref 1.2] ${file} datalog file does not exist!`)
		ERROR(comIssue)
	}
	await continu()
}

const ERROR = info => info !== undefined && log(`\u001b[37m\u001b[1m\u001b[41mERROR DETECTED!\u001b[0m ${info}\n`)
const WARN = info => info !== undefined && log(`\u001b[43m\u001b[37m\u001b[1mWARNING:\u001b[0m ${info}\n`)
const GREEN = info => info !== undefined && log(`\u001b[1m\u001b[37m\u001b[42;1m${info}\u001b[0m`)

const serviceRunning = serviceName => execSync(`sc query ${serviceName}`).toString().indexOf(`RUNNING`) > -1
const startService = async serviceName => execSync(`net start ${serviceName}`).toString()

const checkService = async serviceName => {
	if (!serviceRunning(serviceName)) {
		WARN(`Service ${serviceName} was not running... Attempting to restart...`)
		await startService(serviceName).catch(() => {})
		if (!serviceRunning(serviceName)) ERROR(`[ref 2.1] Service ${serviceName} is not running! Failed to automatically restart!`)
		else WARN(`Service ${serviceName} restarted successfully!`)
		return true
	}
	return false
}

const sleepExit = () => {
	log(`\n\n`)
	let s = 30;
	setInterval(async () => {
		// process.stdout.write('\033c');
		log(`Exiting in ${s--} seconds...   \r`)
		if (s === 0) process.exit(0)
	}, 1000)
}

const keypress = () => {
	process.stdin.setRawMode(true);
	return new Promise((resolve) =>
		process.stdin.once("data", () => {
			process.stdin.setRawMode(false);
			resolve();
		})
	);
};

const continu = async () => {
	log(`Press any key to continue...\n`)
	await keypress()
	console.clear()
}

const checkStatus = async () => {
	log(`\nChecking that all services are running...\n\n\n`)

	// Check Tardis
	const tardisStatus = await checkService("Tardis")

	// Check NPort
	const nPortStatus = await checkService("npsrcsvr")

	// Check Advanced NMEA Data Logger
	const advNMEADataLoggerStatus = await checkService("AdvNMEADataLogger")

	if (!tardisStatus && !nPortStatus && !advNMEADataLoggerStatus) GREEN("No issues found... All services working normally.\n\n")
	else ERROR(`Issues were found. Record the issue and refer to the Trial Instructions if service did not restart\n\n`)

	await continu()

	await checkCom(`COM1`)
	await checkCom(`COM3`)
	await checkCom(`COM4`)
	await checkCom(`COM10`)

	log(`Checking the data log backups...\n`)
	const backupIssues = `Issues were found. Record the issue and refer to the Trial Instructions.\n\n`
	try {
		const latestBackup = (await fs.readdir(`D:\\`)).slice(1).reduce((latest, backup) => {
			// 2020.11.30-00.43.25
			backup = backup.slice(16)
			const year = backup.slice(0, 4)
			const month = backup.slice(5, 7)-1
			const day = backup.slice(8, 10)

			const hour = backup.slice(11, 13)
			const minute = backup.slice(14, 16)
			const second = backup.slice(17, 19)

			const backupAge = new Date() - new Date(year, month, day, hour, minute, second)
			if (latest > backupAge) return backupAge
		}, 999999999999)

		const _24Hours = 24*60*60*1000
		if (latestBackup > _24Hours) {
			ERROR(`[ref 3.1] A backup has not occurred in the last 24 hours!`)
			ERROR(backupIssues)
		} else GREEN("No issues found... Backups working normally.\n\n")
	} catch (err) {
		ERROR(`[ref 3.2] Backup USB not connected!`)
		ERROR(backupIssues)
	}

	await continu()
	process.exit(0)
};
checkStatus().catch(async err => {
	log(`\n An unexpected error occurred while checking status! ${err} \n\n`)
	await continu()
	process.exit(0)
})