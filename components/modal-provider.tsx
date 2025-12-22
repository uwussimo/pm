"use client";

import { useModalStore } from "@/lib/stores/modal-store";
import type {
  TaskCreateData,
  TaskEditData,
  TaskViewData,
  InviteUserData,
  CreateStatusData,
  CreateProjectData,
  ConfirmData,
} from "@/lib/stores/modal-store";
import { TaskDialog } from "@/components/task-dialog";
import { TaskSidebar } from "@/components/task-sidebar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InviteUserDialog } from "@/components/invite-user-dialog";
import { CreateStatusDialog } from "@/components/create-status-dialog";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export function ModalProvider() {
  const modals = useModalStore((state) => state.modals);
  const close = useModalStore((state) => state.close);

  return (
    <>
      {modals.map((modal) => {
        const handleClose = () => close(modal.id);

        switch (modal.type) {
          case "taskCreate":
          case "taskEdit": {
            const data = modal.data as TaskCreateData | TaskEditData;
            const taskId = "taskId" in data ? data.taskId : null;
            const statusId = "statusId" in data ? data.statusId : null;
            
            return (
              <TaskDialog
                key={modal.id}
                open={true}
                onOpenChange={handleClose}
                projectId={data.projectId}
                statusId={statusId}
                taskId={taskId}
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

