import * as vscode from "vscode"
import * as fs from "fs"
import * as path from "path"
import { DateTime } from "luxon"

/// Path Functions

export function getBasePath(): string {
    const config: string | undefined = vscode.workspace.getConfiguration("task-parser").get("baseDir")
    if (!config) {
        vscode.window.showErrorMessage("No base path found in user settings. Cannot load tasks.")
        throw "Error"
    }
    return config
}

export function getProjectPath() {
    return getBasePath().concat("/", "Active")
}

export function getInboxPath(): string {
    return getBasePath().concat("/", "Inbox.md")
}

export function getProjectFiles(): path.ParsedPath[] {
    const projectDir = getProjectPath()
    const projectFiles = fs
        .readdirSync(projectDir)
        .map((file) => path.parse(path.join(projectDir, file)))
        .filter((file) => file.ext === ".md")
    return projectFiles
}

export function getInboxFile(): path.ParsedPath {
    return path.parse(getInboxPath())
}

export function formProjectPath(name: string): string {
    const projectPath = getProjectPath()
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
