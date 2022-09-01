import { appendFile } from 'fs/promises';

export const log = async (str: string) => {
	process.stdout.write(str);
	await appendFile('log.txt', `\n${new Date().toString()} - ${str}`).catch((err) => log(`\n An unexpected error occurred while checking status! ${err} \n\n`));
};

export const ERROR = async (info: string) => log(`\u001b[37m\u001b[1m\u001b[41mERROR DETECTED!\u001b[0m ${info}\n`);
export const WARN = async (info: string) => log(`\u001b[43m\u001b[37m\u001b[1mWARNING:\u001b[0m ${info}\n`);
export const GREEN = async (info: string) => log(`\u001b[1m\u001b[37m\u001b[42;1m${info}\u001b[0m`);

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

export const dateFormat = (date: Date, fstr: string) => {
	return fstr.replace(/%[YmdHMS]/g, (m: string) => {
		switch (m) {
			case '%Y':
				return date.getUTCFullYear().toString(); // no leading zeros required
			case '%m':
				m = 1 + date.getUTCMonth().toString();
				break;
			case '%d':
				m = date.getUTCDate().toString();
				break;
			case '%H':
				m = date.getUTCHours().toString();
				break;
			case '%M':
				m = date.getUTCMinutes().toString();
				break;
			case '%S':
				m = date.getUTCSeconds().toString();
				break;
			default:
				return m.slice(1); // unknown code, remove %
		}
		// add leading zero if required
		return ('0' + m).slice(-2);
	});
};
