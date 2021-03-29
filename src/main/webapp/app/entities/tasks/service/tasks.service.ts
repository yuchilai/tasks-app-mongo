import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as dayjs from 'dayjs';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ITasks, getTasksIdentifier } from '../tasks.model';

export type EntityResponseType = HttpResponse<ITasks>;
export type EntityArrayResponseType = HttpResponse<ITasks[]>;

@Injectable({ providedIn: 'root' })
export class TasksService {
  public resourceUrl = this.applicationConfigService.getEndpointFor('api/tasks');

  constructor(protected http: HttpClient, private applicationConfigService: ApplicationConfigService) {}

  create(tasks: ITasks): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(tasks);
    return this.http
      .post<ITasks>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  update(tasks: ITasks): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(tasks);
    return this.http
      .put<ITasks>(`${this.resourceUrl}/${getTasksIdentifier(tasks) as string}`, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  partialUpdate(tasks: ITasks): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(tasks);
    return this.http
      .patch<ITasks>(`${this.resourceUrl}/${getTasksIdentifier(tasks) as string}`, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<ITasks>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<ITasks[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  addTasksToCollectionIfMissing(tasksCollection: ITasks[], ...tasksToCheck: (ITasks | null | undefined)[]): ITasks[] {
    const tasks: ITasks[] = tasksToCheck.filter(isPresent);
    if (tasks.length > 0) {
      const tasksCollectionIdentifiers = tasksCollection.map(tasksItem => getTasksIdentifier(tasksItem)!);
      const tasksToAdd = tasks.filter(tasksItem => {
        const tasksIdentifier = getTasksIdentifier(tasksItem);
        if (tasksIdentifier == null || tasksCollectionIdentifiers.includes(tasksIdentifier)) {
          return false;
        }
        tasksCollectionIdentifiers.push(tasksIdentifier);
        return true;
      });
      return [...tasksToAdd, ...tasksCollection];
    }
    return tasksCollection;
  }

  protected convertDateFromClient(tasks: ITasks): ITasks {
    return Object.assign({}, tasks, {
      dueDate: tasks.dueDate?.isValid() ? tasks.dueDate.format(DATE_FORMAT) : undefined,
    });
  }

  protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
    if (res.body) {
      res.body.dueDate = res.body.dueDate ? dayjs(res.body.dueDate) : undefined;
    }
    return res;
  }

  protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
    if (res.body) {
      res.body.forEach((tasks: ITasks) => {
        tasks.dueDate = tasks.dueDate ? dayjs(tasks.dueDate) : undefined;
      });
    }
    return res;
  }
}
