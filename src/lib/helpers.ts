import { appendFile } from 'fs/promises';

export const log = async (str: string, raw?: string) => {
	process.stdout.write(str);
	await appendFile('log.txt', `\n${Date.now()},${raw || str}`).catch((err) => log(`\nAn unexpected error occurred while checking status! ${err}\n\n`));
};

export const ERROR = async (info: string) => log(`\u001b[37m\u001b[1m\u001b[41mERROR DETECTED!\u001b[0m ${info}\n`, info);
export const WARN = async (info: string) => log(`\u001b[43m\u001b[37m\u001b[1mWARNING:\u001b[0m ${info}\n`, info);
export const GREEN = async (info: string) => log(`\u001b[1m\u001b[37m\u001b[42;1m${info}\u001b[0m`, info);

export const keypress = () => {
	process.stdin.setRawMode(true);
	return new Promise((res) =>
		process.stdin.once('data', () => {
			process.stdin.setRawMode(false);
			res(null);
		})
	);
};

export const continu = async () => {
	await log(`Press any key to continue...\n`);
	await keypress();
	console.clear();
};
