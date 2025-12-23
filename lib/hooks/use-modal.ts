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

export function useModal() {
  const { open, close, closeAll, isOpen } = useModalStore();

  return {
    // Task modals
    openTaskCreate: (data: TaskCreateData) => open("taskCreate", data),
    openTaskEdit: (data: TaskEditData) => open("taskEdit", data),
    openTaskView: (data: TaskViewData) => open("taskView", data),

    // Project modals
    openInviteUser: (data: InviteUserData) => open("inviteUser", data),
    openManageUsers: (data: ManageUsersData) => open("manageUsers", data),
    openShareProject: (data: ShareProjectData) => open("shareProject", data),
    openCreateStatus: (data: CreateStatusData) => open("createStatus", data),
    openCreateProject: (data: CreateProjectData) => open("createProject", data),

    // Confirmation modal
    confirm: (data: ConfirmData) => open("confirm", data),

    // Generic actions
    close,
    closeAll,
    isOpen,
  };
}
