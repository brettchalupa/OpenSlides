import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MotionCommentSection } from 'app/shared/models/motions/motion-comment-section';
import { ViewMotionCommentSection } from '../../models/view-motion-comment-section';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { BaseViewComponent } from '../../../base/base-view';
import { ViewGroup } from 'app/site/users/models/view-group';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';

/**
 * List view for the comment sections.
 */
@Component({
    selector: 'os-motion-comment-section-list',
    templateUrl: './motion-comment-section-list.component.html',
    styleUrls: ['./motion-comment-section-list.component.scss']
})
export class MotionCommentSectionListComponent extends BaseViewComponent implements OnInit {
    public commentSectionToCreate: MotionCommentSection | null;

    /**
     * Source of the Data
     */
    public commentSections: ViewMotionCommentSection[] = [];

    /**
     * The current focussed formgroup
     */
    public updateForm: FormGroup;

    public createForm: FormGroup;

    public openId: number | null;
    public editId: number | null;

    public groups: BehaviorSubject<ViewGroup[]>;

    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     * @param matSnackBar
     * @param repo
     * @param formBuilder
     * @param promptService
     * @param DS
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private repo: MotionCommentSectionRepositoryService,
        private formBuilder: FormBuilder,
        private promptService: PromptService,
        private groupRepo: GroupRepositoryService
    ) {
        super(titleService, translate, matSnackBar);

        const form = {
            name: ['', Validators.required],
            read_groups_id: [[]],
            write_groups_id: [[]]
        };
        this.createForm = this.formBuilder.group(form);
        this.updateForm = this.formBuilder.group(form);
    }

    /**
     * Event on Key Down in update or create form.
     *
     * @param event the keyboard event
     * @param the current view in scope
     */
    public keyDownFunction(event: KeyboardEvent, viewSection?: ViewMotionCommentSection): void {
        if (event.key === 'Enter' && event.shiftKey) {
            if (viewSection) {
                this.onSaveButton(viewSection);
            } else {
                this.create();
            }
        }
        if (event.key === 'Escape') {
            if (viewSection) {
                this.editId = null;
            } else {
                this.commentSectionToCreate = null;
            }
        }
    }

    /**
     * Init function.
     */
    public ngOnInit(): void {
        super.setTitle('Comment fields');
        this.groups = new BehaviorSubject(this.groupRepo.getViewModelList());
        this.groupRepo.getViewModelListObservable().subscribe(groups => this.groups.next(groups));
        this.repo.getViewModelListObservable().subscribe(newViewSections => (this.commentSections = newViewSections));
    }

    /**
     * Opens the create form.
     */
    public onPlusButton(): void {
        if (!this.commentSectionToCreate) {
            this.commentSectionToCreate = new MotionCommentSection();
            this.createForm.setValue({
                name: '',
                read_groups_id: [],
                write_groups_id: []
            });
        }
    }

    /**
     * Creates the comment section from the create form.
     */
    public create(): void {
        if (this.createForm.valid) {
            this.commentSectionToCreate.patchValues(this.createForm.value as MotionCommentSection);
            this.repo
                .create(this.commentSectionToCreate)
                .then(() => (this.commentSectionToCreate = null), this.raiseError);
        }
    }

    /**
     * Executed on edit button
     * @param viewSection
     */
    public onEditButton(viewSection: ViewMotionCommentSection): void {
        this.editId = viewSection.id;

        this.updateForm.setValue({
            name: viewSection.name,
            read_groups_id: viewSection.read_groups_id,
            write_groups_id: viewSection.write_groups_id
        });
    }

    /**
     * Saves the comment section
     *
     * @param viewSection The section to save
     */
    public onSaveButton(viewSection: ViewMotionCommentSection): void {
        if (this.updateForm.valid) {
            this.repo.update(this.updateForm.value as Partial<MotionCommentSection>, viewSection).then(() => {
                this.openId = this.editId = null;
            }, this.raiseError);
        }
    }

    /**
     * is executed, when the delete button is pressed
     * @param viewSection The section to delete
     */
    public async onDeleteButton(viewSection: ViewMotionCommentSection): Promise<void> {
        const content = this.translate.instant('Delete') + ` ${viewSection.name}?`;
        if (await this.promptService.open('Are you sure?', content)) {
            this.repo.delete(viewSection).then(() => (this.openId = this.editId = null), this.raiseError);
        }
    }

    /**
     * Is executed when a mat-extension-panel is closed
     * @param viewSection the section in the panel
     */
    public panelClosed(viewSection: ViewMotionCommentSection): void {
        this.openId = null;
        if (this.editId) {
            this.onSaveButton(viewSection);
        }
    }
}
