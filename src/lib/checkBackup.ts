import { readdir } from 'fs/promises';
import { log, ERROR, GREEN, continu } from './helpers.js';

export const checkBackups = async (backupDir: string) => {
	await log(`Checking if backups exist in ${backupDir}\n`);
	const backupIssues = `Issues were found. Record the issue and refer to the Trial Instructions.\n`;
	try {
		const latestBackup = (await readdir(backupDir)).slice(1).reduce((latest, backup) => {
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
			return latest;
		}, Number.MAX_SAFE_INTEGER);

		const _24Hours = 24 * 60 * 60 * 1000;
		if (latestBackup > _24Hours) {
			await ERROR(`[ref 3.1] A backup has not occurred in the last 24 hours!`);
			await ERROR(backupIssues);
		} else await GREEN('No issues found... Backups working normally.\n');
	} catch (err) {
		await ERROR(`[ref 3.2] Backup USB not connected!`);
		await ERROR(backupIssues);
	}
	await continu();
};
