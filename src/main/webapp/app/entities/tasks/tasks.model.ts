import * as dayjs from 'dayjs';

export interface ITasks {
  id?: string;
  name?: string | null;
  dueDate?: dayjs.Dayjs | null;
  completed?: boolean | null;
}

export class Tasks implements ITasks {
  constructor(public id?: string, public name?: string | null, public dueDate?: dayjs.Dayjs | null, public completed?: boolean | null) {
    this.completed = this.completed ?? false;
  }
}

export function getTasksIdentifier(tasks: ITasks): string | undefined {
  return tasks.id;
}
