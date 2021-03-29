import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ITasks, Tasks } from '../tasks.model';
import { TasksService } from '../service/tasks.service';

@Component({
  selector: 'jhi-tasks-update',
  templateUrl: './tasks-update.component.html',
})
export class TasksUpdateComponent implements OnInit {
  isSaving = false;

  editForm = this.fb.group({
    id: [],
    name: [],
    dueDate: [],
    completed: [],
  });

  constructor(protected tasksService: TasksService, protected activatedRoute: ActivatedRoute, protected fb: FormBuilder) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ tasks }) => {
      this.updateForm(tasks);
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const tasks = this.createFromForm();
    if (tasks.id !== undefined) {
      this.subscribeToSaveResponse(this.tasksService.update(tasks));
    } else {
      this.subscribeToSaveResponse(this.tasksService.create(tasks));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ITasks>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(
      () => this.onSaveSuccess(),
      () => this.onSaveError()
    );
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(tasks: ITasks): void {
    this.editForm.patchValue({
      id: tasks.id,
      name: tasks.name,
      dueDate: tasks.dueDate,
      completed: tasks.completed,
    });
  }

  protected createFromForm(): ITasks {
    return {
      ...new Tasks(),
      id: this.editForm.get(['id'])!.value,
      name: this.editForm.get(['name'])!.value,
      dueDate: this.editForm.get(['dueDate'])!.value,
      completed: this.editForm.get(['completed'])!.value,
    };
  }
}
