import * as todo from "./todos"
import * as vscode from "vscode"
import * as util from "./util"
import * as main from "./extension"

export class ExtensionCommands {
    constructor(context: vscode.ExtensionContext) {
        const functions = [
            addTaskToInbox,
            archiveProject,
            createProject,
            decreaseDateDay,
            decreaseDateWeek,
            findTask,
            increaseDateDay,
            increaseDateWeek,
            // moveTaskToProject,
            openFile,
            openInbox,
            openProject,
            refreshTasks,
            toggleDate,
            toggleDone,
            toggleNext,
            toggleTodo,
            toggleWait,
        ]
        functions.forEach((fn) => {
            context.subscriptions.push(vscode.commands.registerCommand(`tp.${fn.name}`, fn))
        })
    }
}

/// Tree View Functions
export async function openFile(path: string, line?: number) {
    util.openFile(path, line)
}

function refreshTasks() {
    main.refresh()
}

/// Task and Project Management Functions
export async function createProject() {
    vscode.window.showInputBox({ prompt: "New Project Name", value: "" }).then((projectName) => {
        if (projectName) {
            util.createFile(util.formProjectPath(projectName))
            main.refresh()
        }
    })
}

export async function openProject() {
    const choices = util.getProjectFiles().map((f) => ({ label: f.name, file: f }))
    vscode.window.showQuickPick(choices).then(async (pick) => {
        if (pick) {
            util.openFile(util.getFullPath(pick.file))
        }
    })
}

export async function archiveProject() {
    const choices = util.getProjectFiles().map((f) => ({ label: f.name, file: f }))
    vscode.window.showQuickPick(choices).then(async (pick) => {
        if (pick) {
            const oldPath = util.getFullPath(pick.file)
            const newPath = util.getArchivePath().concat(`/${util.getDate()} ${pick.file.base}`)
            util.moveFile(oldPath, newPath)
        }
    })
}

export async function openInbox() {
    util.openFile(util.getInboxPath())
}

export async function addTaskToInbox() {
    vscode.window.showInputBox({ prompt: "New Task Title", value: "" }).then((newTask) => {
        if (newTask) {
            const inboxFile = util.getInboxPath()
            const inboxText = util.getFileContents(util.getInboxFile())
            const taskText = `${inboxText.endsWith("\n") ? "" : "\n"}- [ ] ${newTask}`
            util.appendToFile(inboxFile, taskText)
            main.refresh()
        }
    })
}

export async function findTask() {
    const todos = main.Todos.get()
    const choices = todos.map((todo) => ({ label: todo.text, todo: todo }))
    vscode.window.showQuickPick(choices).then(async (pick) => {
        if (pick) {
            util.openFile(pick.todo.path, pick.todo.line)
        }
    })
}



/// Task Management Functions

export async function toggleDone() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.toggleDone(line))
}

export async function toggleTodo() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.toggleTodo(line))
}

export async function toggleDate() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.toggleDate(line))
}

export async function toggleWait() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.toggleWait(line))
}

export async function toggleNext() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.toggleNext(line))
}

export async function increaseDateDay() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.increaseDate(line, 1))
}

export async function decreaseDateDay() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.decreaseDate(line, 1))
}

export async function increaseDateWeek() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.increaseDate(line, 7))
}

export async function decreaseDateWeek() {
    const lineOperations = new todo.LineOperations()
    util.SubstituteLine.substitute((line) => lineOperations.decreaseDate(line, 7))
}
