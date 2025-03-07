import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"
import { DateTime } from "luxon"

/// Path Functions

export function getBasePath(): string {
    const baseDir: string | undefined = vscode.workspace.getConfiguration("task-parser").get("baseDir")
    if (!baseDir) {
        vscode.window.showErrorMessage("No base path found in user settings. Cannot load tasks.")
        throw "Error"
    }
    return baseDir
}

export function getActivePath() {
    return getBasePath().concat("/", "Active")
}

export function getArchivePath() {
    return getBasePath().concat("/", "Archive")
}

export function getInboxPath(): string {
    return getBasePath().concat("/", "Inbox.md")
}

export function getProjectFiles(): path.ParsedPath[] {
    const basePath = getBasePath()
    const projectDirs = ["Active", "Someday"]
    return projectDirs
        .map((projectDir) => basePath.concat("/", projectDir))
        .flatMap((projectDir) => {
            return fs
                .readdirSync(projectDir)
                .map((file) => path.parse(path.join(projectDir, file)))
                .filter((file) => file.ext === ".md")
        })
}

export function getInboxFile(): path.ParsedPath {
    return path.parse(getInboxPath())
}

export function formProjectPath(name: string): string {
    const projectPath = getActivePath()
    return projectPath.concat("/", name, ".md")
}

export function getFullPath(file: path.ParsedPath): string {
    return path.join(file.dir, file.base)
}

/// Read and Write Operations

export function getFileContents(filePath: path.ParsedPath): string {
    return `${fs.readFileSync(path.format(filePath))}`
}

export function appendToFile(path: string, data: string) {
    fs.appendFileSync(path, data)
}

export function createFile(path: string, data: string = "") {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, data)
    }
}

export function moveFile(oldPath: string, newPath: string) {
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath)
    }
}

export class SubstituteLine {
    static substitute = (substitute: (line: string) => string) => {
        const line = getCurrentLine()
        const updatedLine = substitute(line.text)
        replaceLine(line, updatedLine)
    }
}

/// VSCode Utilities

export async function openFile(path: string, line?: number) {
    await vscode.window.showTextDocument(vscode.Uri.parse(path))
    if (line) {
        const editor = vscode.window.activeTextEditor
        if (editor) {
            const newSelection = new vscode.Selection(line, 0, line, 0)
            editor.selection = newSelection
            editor.revealRange(newSelection)
        }
    }
}

export function getCurrentLine(): vscode.TextLine {
    const editor = vscode.window.activeTextEditor
    const line = editor?.document.lineAt(editor.selection.start)
    if (!editor || !line || !line.range || !line.text) {
        throw new Error("Error getting current line.")
    }
    return line
}

export function replaceLine(line: vscode.TextLine, data: string) {
    vscode.window.activeTextEditor?.edit((editor) => editor.replace(line.range, data))
}

/// Date utilities

export function getDate(): string {
    const date = new Date()
    return date.toISOString().substr(0, 10)
}

export function isOverdue(date: string): boolean {
    return DateTime.fromISO(date).plus({ days: 1 }) <= DateTime.now()
}

export function isDue(date: string): boolean {
    return DateTime.fromISO(date) <= DateTime.now()
}

export function increaseDate(date: string, days: number): string {
    const base = DateTime.fromISO(date).plus({ days: days }).toISODate()
    return base
}

export function decreaseDate(date: string, days: number): string {
    const base = DateTime.fromISO(date).minus({ days: days }).toISODate()
    return base
}

export function getDateDescription(date: string, format: string = "EEEE, LLL dd") {
    return DateTime.fromISO(date).toFormat(format)
}