import chalk, { Chalk, type ChalkInstance } from "chalk";

let _chalk: ChalkInstance = chalk;

export function setColorEnabled(enabled: boolean): void {
  _chalk = new Chalk({ level: enabled ? chalk.level : 0 });
}

export function c(): ChalkInstance {
  return _chalk;
}
