import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ITasks } from '../tasks.model';
import { TasksService } from '../service/tasks.service';
import { TasksDeleteDialogComponent } from '../delete/tasks-delete-dialog.component';

@Component({
  selector: 'jhi-tasks',
  templateUrl: './tasks.component.html',
})
export class TasksComponent implements OnInit {
  tasks?: ITasks[];
  isLoading = false;

  constructor(protected tasksService: TasksService, protected modalService: NgbModal) {}

  loadAll(): void {
    this.isLoading = true;

    this.tasksService.query().subscribe(
      (res: HttpResponse<ITasks[]>) => {
        this.isLoading = false;
        this.tasks = res.body ?? [];
      },
      () => {
        this.isLoading = false;
      }
    );
  }

  ngOnInit(): void {
    this.loadAll();
  }

  trackId(index: number, item: ITasks): string {
    return item.id!;
  }

  delete(tasks: ITasks): void {
    const modalRef = this.modalService.open(TasksDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.tasks = tasks;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed.subscribe(reason => {
      if (reason === 'deleted') {
        this.loadAll();
      }
    });
  }
}
