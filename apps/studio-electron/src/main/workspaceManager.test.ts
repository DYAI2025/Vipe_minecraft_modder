import { describe, it, expect, beforeEach, vi } from "vitest";
import { app } from "electron";
import { join } from "path";
import {
  getDefaultWorkspacePath,
  getDefaultTemplatePath,
  isValidWorkspacePath,
  getExportDirectory,
  getProjectsDirectory,
} from "./workspaceManager.js";

// Mock electron app
vi.mock("electron", () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === "documents") {
        return "/home/testuser/Documents";
      }
      return `/home/testuser/.${name}`;
    }),
    isPackaged: false,
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
}));

// Mock fs
vi.mock("fs", () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
}));

// Mock electron-log
vi.mock("electron-log", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("WorkspaceManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDefaultWorkspacePath", () => {
    it("should return path in Documents/KidModStudio/workspace", () => {
      const path = getDefaultWorkspacePath();
      expect(path).toBe("/home/testuser/Documents/KidModStudio/workspace");
    });
  });

  describe("getDefaultTemplatePath", () => {
    it("should return development path when not packaged", () => {
      vi.mocked(app).isPackaged = false;
      const path = getDefaultTemplatePath();
      expect(path).toContain("kidmodstudio_exporter_kit/template");
    });

    it("should return production path when packaged", () => {
      vi.mocked(app).isPackaged = true;
      Object.defineProperty(process, "resourcesPath", {
        value: "/Applications/KidModStudio.app/Contents/Resources",
        writable: true,
      });

      const path = getDefaultTemplatePath();
      expect(path).toContain("Resources/templates/fabric");
    });
  });

  describe("isValidWorkspacePath", () => {
    it("should reject empty paths", () => {
      expect(isValidWorkspacePath("")).toBe(false);
    });

    it("should reject root directory", () => {
      expect(isValidWorkspacePath("/")).toBe(false);
      expect(isValidWorkspacePath("C:\\")).toBe(false);
    });

    it("should reject system directories", () => {
      expect(isValidWorkspacePath("/System/Library")).toBe(false);
      expect(isValidWorkspacePath("/usr/bin")).toBe(false);
      expect(isValidWorkspacePath("C:\\Windows\\System32")).toBe(false);
      expect(isValidWorkspacePath("C:\\Program Files\\App")).toBe(false);
    });

    it("should accept valid user paths", () => {
      expect(isValidWorkspacePath("/home/user/workspace")).toBe(true);
      expect(isValidWorkspacePath("C:\\Users\\name\\workspace")).toBe(true);
      expect(isValidWorkspacePath("/home/testuser/Documents/KidModStudio")).toBe(true);
    });
  });

  describe("getExportDirectory", () => {
    it("should return export subdirectory", () => {
      const workspace = "/home/user/workspace";
      const exportDir = getExportDirectory(workspace);
      expect(exportDir).toBe(join(workspace, "export"));
    });
  });

  describe("getProjectsDirectory", () => {
    it("should return projects subdirectory", () => {
      const workspace = "/home/user/workspace";
      const projectsDir = getProjectsDirectory(workspace);
      expect(projectsDir).toBe(join(workspace, "projects"));
    });
  });
});
