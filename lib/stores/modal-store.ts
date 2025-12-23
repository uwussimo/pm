import { create } from "zustand";

// Modal types
export type ModalType =
  | "taskCreate"
  | "taskEdit"
  | "taskView"
  | "inviteUser"
  | "manageUsers"
  | "shareProject"
  | "createStatus"
  | "createProject"
  | "editProject"
  | "confirm";

// Modal data types
export interface TaskCreateData {
  projectId: string;
  statusId: string;
  projectUsers: { id: string; email: string }[];
  statuses: { id: string; name: string; color: string; unicode: string }[];
}

export interface TaskEditData {
  projectId: string;
  taskId: string;
  projectUsers: { id: string; email: string }[];
  statuses: { id: string; name: string; color: string; unicode: string }[];
}

export interface TaskViewData {
  projectId: string;
  taskId: string;
  projectUsers: { id: string; email: string }[];
  statuses: { id: string; name: string; color: string; unicode: string }[];
}

export interface InviteUserData {
  projectId: string;
}

export interface ManageUsersData {
  projectId: string;
}

export interface ShareProjectData {
  projectId: string;
}

export interface CreateStatusData {
  projectId: string;
}

export interface CreateProjectData {}

export interface EditProjectData {
  projectId: string;
  name: string;
  description?: string | null;
}

export interface ConfirmData {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export type ModalData =
  | TaskCreateData
  | TaskEditData
  | TaskViewData
  | InviteUserData
  | ManageUsersData
  | ShareProjectData
  | CreateStatusData
  | CreateProjectData
  | EditProjectData
  | ConfirmData;

export interface Modal {
  id: string;
  type: ModalType;
  data: ModalData;
}

interface ModalStore {
  modals: Modal[];
  open: (type: ModalType, data: ModalData) => string;
  close: (id: string) => void;
  closeAll: () => void;
  isOpen: (type: ModalType) => boolean;
}

export const useModalStore = create<ModalStore>((set, get) => ({
  modals: [],
  
  open: (type, data) => {
    const id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      modals: [...state.modals, { id, type, data }],
    }));
    return id;
  },
  
  close: (id) => {
    set((state) => ({
      modals: state.modals.filter((modal) => modal.id !== id),
    }));
  },
  
  closeAll: () => {
    set({ modals: [] });
  },
  
  isOpen: (type) => {
    return get().modals.some((modal) => modal.type === type);
  },
}));
