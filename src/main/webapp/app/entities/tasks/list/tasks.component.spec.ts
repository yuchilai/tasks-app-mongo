import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { TasksService } from '../service/tasks.service';

import { TasksComponent } from './tasks.component';

describe('Component Tests', () => {
  describe('Tasks Management Component', () => {
    let comp: TasksComponent;
    let fixture: ComponentFixture<TasksComponent>;
    let service: TasksService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        declarations: [TasksComponent],
      })
        .overrideTemplate(TasksComponent, '')
        .compileComponents();

      fixture = TestBed.createComponent(TasksComponent);
      comp = fixture.componentInstance;
      service = TestBed.inject(TasksService);

      const headers = new HttpHeaders().append('link', 'link;link');
      spyOn(service, 'query').and.returnValue(
        of(
          new HttpResponse({
            body: [{ id: 'ABC' }],
            headers,
          })
        )
      );
    });

    it('Should call load all on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(service.query).toHaveBeenCalled();
      expect(comp.tasks?.[0]).toEqual(jasmine.objectContaining({ id: 'ABC' }));
    });
  });
});
