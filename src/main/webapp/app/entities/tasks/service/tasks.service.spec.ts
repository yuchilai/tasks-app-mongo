import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import * as dayjs from 'dayjs';

import { DATE_FORMAT } from 'app/config/input.constants';
import { ITasks, Tasks } from '../tasks.model';

import { TasksService } from './tasks.service';

describe('Service Tests', () => {
  describe('Tasks Service', () => {
    let service: TasksService;
    let httpMock: HttpTestingController;
    let elemDefault: ITasks;
    let expectedResult: ITasks | ITasks[] | boolean | null;
    let currentDate: dayjs.Dayjs;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
      });
      expectedResult = null;
      service = TestBed.inject(TasksService);
      httpMock = TestBed.inject(HttpTestingController);
      currentDate = dayjs();

      elemDefault = {
        id: 'AAAAAAA',
        name: 'AAAAAAA',
        dueDate: currentDate,
        completed: false,
      };
    });

    describe('Service methods', () => {
      it('should find an element', () => {
        const returnedFromService = Object.assign(
          {
            dueDate: currentDate.format(DATE_FORMAT),
          },
          elemDefault
        );

        service.find('ABC').subscribe(resp => (expectedResult = resp.body));

        const req = httpMock.expectOne({ method: 'GET' });
        req.flush(returnedFromService);
        expect(expectedResult).toMatchObject(elemDefault);
      });

      it('should create a Tasks', () => {
        const returnedFromService = Object.assign(
          {
            id: 'ID',
            dueDate: currentDate.format(DATE_FORMAT),
          },
          elemDefault
        );

        const expected = Object.assign(
          {
            dueDate: currentDate,
          },
          returnedFromService
        );

        service.create(new Tasks()).subscribe(resp => (expectedResult = resp.body));

        const req = httpMock.expectOne({ method: 'POST' });
        req.flush(returnedFromService);
        expect(expectedResult).toMatchObject(expected);
      });

      it('should update a Tasks', () => {
        const returnedFromService = Object.assign(
          {
            id: 'BBBBBB',
            name: 'BBBBBB',
            dueDate: currentDate.format(DATE_FORMAT),
            completed: true,
          },
          elemDefault
        );

        const expected = Object.assign(
          {
            dueDate: currentDate,
          },
          returnedFromService
        );

        service.update(expected).subscribe(resp => (expectedResult = resp.body));

        const req = httpMock.expectOne({ method: 'PUT' });
        req.flush(returnedFromService);
        expect(expectedResult).toMatchObject(expected);
      });

      it('should partial update a Tasks', () => {
        const patchObject = Object.assign(
          {
            name: 'BBBBBB',
            dueDate: currentDate.format(DATE_FORMAT),
          },
          new Tasks()
        );

        const returnedFromService = Object.assign(patchObject, elemDefault);

        const expected = Object.assign(
          {
            dueDate: currentDate,
          },
          returnedFromService
        );

        service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

        const req = httpMock.expectOne({ method: 'PATCH' });
        req.flush(returnedFromService);
        expect(expectedResult).toMatchObject(expected);
      });

      it('should return a list of Tasks', () => {
        const returnedFromService = Object.assign(
          {
            id: 'BBBBBB',
            name: 'BBBBBB',
            dueDate: currentDate.format(DATE_FORMAT),
            completed: true,
          },
          elemDefault
        );

        const expected = Object.assign(
          {
            dueDate: currentDate,
          },
          returnedFromService
        );

        service.query().subscribe(resp => (expectedResult = resp.body));

        const req = httpMock.expectOne({ method: 'GET' });
        req.flush([returnedFromService]);
        httpMock.verify();
        expect(expectedResult).toContainEqual(expected);
      });

      it('should delete a Tasks', () => {
        service.delete('ABC').subscribe(resp => (expectedResult = resp.ok));

        const req = httpMock.expectOne({ method: 'DELETE' });
        req.flush({ status: 200 });
        expect(expectedResult);
      });

      describe('addTasksToCollectionIfMissing', () => {
        it('should add a Tasks to an empty array', () => {
          const tasks: ITasks = { id: 'ABC' };
          expectedResult = service.addTasksToCollectionIfMissing([], tasks);
          expect(expectedResult).toHaveLength(1);
          expect(expectedResult).toContain(tasks);
        });

        it('should not add a Tasks to an array that contains it', () => {
          const tasks: ITasks = { id: 'ABC' };
          const tasksCollection: ITasks[] = [
            {
              ...tasks,
            },
            { id: 'CBA' },
          ];
          expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, tasks);
          expect(expectedResult).toHaveLength(2);
        });

        it("should add a Tasks to an array that doesn't contain it", () => {
          const tasks: ITasks = { id: 'ABC' };
          const tasksCollection: ITasks[] = [{ id: 'CBA' }];
          expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, tasks);
          expect(expectedResult).toHaveLength(2);
          expect(expectedResult).toContain(tasks);
        });

        it('should add only unique Tasks to an array', () => {
          const tasksArray: ITasks[] = [{ id: 'ABC' }, { id: 'CBA' }, { id: 'Gorgeous Frozen Rustic' }];
          const tasksCollection: ITasks[] = [{ id: 'ABC' }];
          expectedResult = service.addTasksToCollectionIfMissing(tasksCollection, ...tasksArray);
          expect(expectedResult).toHaveLength(3);
        });

        it('should accept varargs', () => {
          const tasks: ITasks = { id: 'ABC' };
          const tasks2: ITasks = { id: 'CBA' };
          expectedResult = service.addTasksToCollectionIfMissing([], tasks, tasks2);
          expect(expectedResult).toHaveLength(2);
          expect(expectedResult).toContain(tasks);
          expect(expectedResult).toContain(tasks2);
        });

        it('should accept null and undefined values', () => {
          const tasks: ITasks = { id: 'ABC' };
          expectedResult = service.addTasksToCollectionIfMissing([], null, tasks, undefined);
          expect(expectedResult).toHaveLength(1);
          expect(expectedResult).toContain(tasks);
        });
      });
    });

    afterEach(() => {
      httpMock.verify();
    });
  });
});
