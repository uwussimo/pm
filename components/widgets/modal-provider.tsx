"use client";

import { useModalStore } from "@/lib/stores/modal-store";
import type {
  TaskCreateData,
  TaskEditData,
  TaskViewData,
  InviteUserData,
  ManageUsersData,
  ShareProjectData,
  CreateStatusData,
  CreateProjectData,
  ConfirmData,
} from "@/lib/stores/modal-store";
import { TaskDialog } from "@/components/features/tasks/task-dialog";
import { TaskSidebar } from "@/components/features/tasks/task-sidebar";
import { ConfirmDialog } from "@/components/widgets/confirm-dialog";
import { InviteUserDialog } from "@/components/features/projects/invite-user-dialog";
import { ManageUsersDialog } from "@/components/features/projects/manage-users-dialog";
import { ShareProjectDialog } from "@/components/features/projects/share-project-dialog";
import { CreateStatusDialog } from "@/components/features/statuses/create-status-dialog";
import { CreateProjectDialog } from "@/components/features/projects/create-project-dialog";

export function ModalProvider() {
  const modals = useModalStore((state) => state.modals);
  const close = useModalStore((state) => state.close);

  return (
    <>
      {modals.map((modal) => {
        const handleClose = () => close(modal.id);

        switch (modal.type) {
          case "taskCreate": {
            const data = modal.data as TaskCreateData;
            return (
              <TaskDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                projectId={data.projectId}
                statusId={data.statusId}
                statuses={data.statuses}
              />
            );
          }

          case "taskEdit": {
            const data = modal.data as TaskEditData;
            return (
              <TaskSidebar
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                taskId={data.taskId}
                projectId={data.projectId}
                projectUsers={data.projectUsers}
                statuses={data.statuses}
              />
            );
          }

          case "taskView": {
            const data = modal.data as TaskViewData;
            return (
              <TaskSidebar
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                taskId={data.taskId}
                projectId={data.projectId}
                projectUsers={data.projectUsers}
                statuses={data.statuses}
              />
            );
          }

          case "inviteUser": {
            const data = modal.data as InviteUserData;
            return (
              <InviteUserDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                projectId={data.projectId}
              />
            );
          }

          case "manageUsers": {
            const data = modal.data as ManageUsersData;
            return (
              <ManageUsersDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                projectId={data.projectId}
              />
            );
          }

          case "shareProject": {
            const data = modal.data as ShareProjectData;
            return (
              <ShareProjectDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                projectId={data.projectId}
              />
            );
          }

          case "createStatus": {
            const data = modal.data as CreateStatusData;
            return (
              <CreateStatusDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                projectId={data.projectId}
              />
            );
          }

          case "createProject": {
            return (
              <CreateProjectDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
              />
            );
          }

          case "confirm": {
            const data = modal.data as ConfirmData;
            return (
              <ConfirmDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                data={data}
              />
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
