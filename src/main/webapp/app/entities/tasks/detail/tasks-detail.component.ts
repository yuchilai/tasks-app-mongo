import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ITasks } from '../tasks.model';

@Component({
  selector: 'jhi-tasks-detail',
  templateUrl: './tasks-detail.component.html',
})
export class TasksDetailComponent implements OnInit {
  tasks: ITasks | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ tasks }) => {
      this.tasks = tasks;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
