import { stat, readFile, readdir } from 'fs/promises';
import { dateFormat, continu } from './helpers.js';
import { log, ERROR, GREEN } from './helpers.js';

export const checkDir = async (baseDataDir: string, dir: string) => {
	const dirIssue = `Issues were found with ${dir}. Record the issue and refer to the Trial Instructions.\n`;
	await log(`Checking data is being logged in: ${dir}...\n`);
	const dirPath = `${baseDataDir}\\${dir}`;
	try {
		const files = await readdir(dirPath);
		const latestFile = files.filter(async (file) => {
			const fileStats = await stat(file);
			const fileAge = Date.now() - fileStats.mtime.getTime();
			return fileAge > 1 * 60 * 1000;
		})[0];
		if (latestFile.length === undefined) {
			await ERROR(`[ref 1.1] No files in ${dir} have been updated in the last minute.`);
			await ERROR(dirIssue);
		} else {
			const fileData = (await readFile(`${baseDataDir}\\${dir}\\${latestFile}`)).toString().split('\n');
			const fileString = fileData
				.slice(fileData.length - 20, fileData.length)
				.join('\n')
				.slice(1000);
			await GREEN(
				`No issues found with ${dir}. Here is the latest data, please check if sensible data is being logged.\nRefer to Trial Instructions (Annex A) for examples: \n\n`
			);
			await log(`${fileString}\n`);
		}
	} catch (err) {
		await ERROR(`An unexpected error occoured when checking ${dir}. ${(<Error>err).message}!`);
		await ERROR(dirIssue);
	}
	await continu();
};
