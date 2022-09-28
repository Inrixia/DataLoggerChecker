import { stat, readFile } from 'fs/promises';
import { dateFormat, continu } from './helpers';
import { log, ERROR, GREEN } from './helpers';

export const checkCom = async (com: string) => {
	const comIssue = `Issues were found with ${com}. Record the issue and refer to the Trial Instructions.\n`;
	await log(`Checking data is being logged from: ${com}...\n`);
	const file = dateFormat(new Date(), `C:\\DataLog\\_${com}\\data%Y%m%d%H.log`);
	try {
		const COM = await stat(file);
		const timeOld = Date.now() - COM.mtime.getTime();
		if (timeOld > 1 * 60 * 1000) {
			await ERROR(`[ref 1.1] ${com} datalog file has not been updated in the last minute.`);
			await ERROR(comIssue);
		} else {
			const COMData = (await readFile(file)).toString().split('\n');
			await GREEN(
				`No issues found with ${com}. Here are the latest 20 lines to check if sensible data is being logged.\nRefer to Trial Instructions (Annex A) for examples: \n\n`
			);
			await log(`${COMData.slice(COMData.length - 20, COMData.length).join('\n')}\n`);
		}
	} catch (err) {
		await ERROR(`[ref 1.2] ${file} datalog file does not exist!`);
		await ERROR(comIssue);
	}
	await continu();
};
