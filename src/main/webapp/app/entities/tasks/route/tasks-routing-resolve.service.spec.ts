jest.mock('@angular/router');

import { TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of } from 'rxjs';

import { ITasks, Tasks } from '../tasks.model';
import { TasksService } from '../service/tasks.service';

import { TasksRoutingResolveService } from './tasks-routing-resolve.service';

describe('Service Tests', () => {
  describe('Tasks routing resolve service', () => {
    let mockRouter: Router;
    let mockActivatedRouteSnapshot: ActivatedRouteSnapshot;
    let routingResolveService: TasksRoutingResolveService;
    let service: TasksService;
    let resultTasks: ITasks | undefined;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [Router, ActivatedRouteSnapshot],
      });
      mockRouter = TestBed.inject(Router);
      mockActivatedRouteSnapshot = TestBed.inject(ActivatedRouteSnapshot);
      routingResolveService = TestBed.inject(TasksRoutingResolveService);
      service = TestBed.inject(TasksService);
      resultTasks = undefined;
    });

    describe('resolve', () => {
      it('should return ITasks returned by find', () => {
        // GIVEN
        service.find = jest.fn(id => of(new HttpResponse({ body: { id } })));
        mockActivatedRouteSnapshot.params = { id: 'ABC' };

        // WHEN
        routingResolveService.resolve(mockActivatedRouteSnapshot).subscribe(result => {
          resultTasks = result;
        });

        // THEN
        expect(service.find).toBeCalledWith('ABC');
        expect(resultTasks).toEqual({ id: 'ABC' });
      });

      it('should return new ITasks if id is not provided', () => {
        // GIVEN
        service.find = jest.fn();
        mockActivatedRouteSnapshot.params = {};

        // WHEN
        routingResolveService.resolve(mockActivatedRouteSnapshot).subscribe(result => {
          resultTasks = result;
        });

        // THEN
        expect(service.find).not.toBeCalled();
        expect(resultTasks).toEqual(new Tasks());
      });

      it('should route to 404 page if data not found in server', () => {
        // GIVEN
        spyOn(service, 'find').and.returnValue(of(new HttpResponse({ body: null })));
        mockActivatedRouteSnapshot.params = { id: 'ABC' };

        // WHEN
        routingResolveService.resolve(mockActivatedRouteSnapshot).subscribe(result => {
          resultTasks = result;
        });

        // THEN
        expect(service.find).toBeCalledWith('ABC');
        expect(resultTasks).toEqual(undefined);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['404']);
      });
    });
  });
});
