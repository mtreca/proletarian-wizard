import * as util from "./util"
import * as path from "path"
import * as vscode from "vscode"

export enum TodoView {
    Today,
    Inbox,
    Scheduled,
    Anytime,
    Someday,
}

// TODO: This should not be an interface but a full class.
export interface TodoItem {
    mark: string
    date: string
    text: string
    path: string
    line: number
    file: string
}

// TODO: Rename with more descriptive name
export class TodoGroup {
    constructor(private todos: TodoItem[]) {
        this.todos = todos
    }

    public refresh() {
        this.todos = this.findAllTodos()
    }

    public showOverdueTodos() {
        const overdueTodos = this.todos.filter((todo) => todo.mark === "[ ]" && todo.date && util.isOverdue(todo.date))
        if (overdueTodos && overdueTodos.length) {
            vscode.window.showWarningMessage("You have overdue tasks.")
        }
    }

    private findAllTodos(): TodoItem[] {
        const parser = new LineOperations()

        const todos: TodoItem[] = []
        const files = [...util.getProjectPaths(), util.getFilePath(undefined, "Inbox")]

        files.forEach((filePath) => {
            let fileLines = util.getFileContents(filePath).split("\n")
            let fileTasks = fileLines
                .map((line, number) => parser.toTodo(path.parse(filePath), line, number))
                .filter((item): item is TodoItem => !!item)
            fileTasks.forEach((task) => {
                todos.push(task)
            })
        })

        return todos
    }

    public get(view?: TodoView): TodoItem[] {
        switch (view) {
            case TodoView.Inbox:
                return this.todos.filter((todo) => todo.file === "Inbox")
            case TodoView.Anytime:
                return this.todos.filter((todo) => todo.file !== "Inbox" && !todo.date && todo.mark === "[ ]")
            case TodoView.Scheduled:
                return this.todos.filter((todo) => todo.file !== "Inbox" && todo.date && todo.mark === "[ ]")
            case TodoView.Someday:
                return this.todos.filter((todo) => todo.file !== "Inbox" && todo.mark === "[-]")
            case TodoView.Today:
                return this.todos.filter(
                    (todo) => todo.file !== "Inbox" && todo.mark === "[ ]" && todo.date && util.isDue(todo.date)
                )
            default:
                return this.todos
        }
    }
}

// TODO: This should be a class. From and to string. That's it.

interface ParsedLine {
    indent: string
    marker: string
    check: string
    date: string
    line: string
}

// TODO: Make this a class
export class LineOperations {
    constructor() {}

    // TODO: Extract function isTask or something that simply checks if a given line is a TODO.

    // TODO: Refactor this to make it NOT WORK on line that are not tasks. Much easier.
    private parseLine(line: string): ParsedLine {
        // TODO: Wait, do I need to return a struct at all if the regex doesn't match?
        let struct = { indent: "", marker: "", check: "", date: "", line: line }
        const regexp = /^(\s*)?(?:([*-]|\d+\.)\s*)?(?:(\[.?\])\s+)?(?:((?:\d\d\d\d-)?\d\d-\d\d):\s*)?(.+)/
        const parsed = regexp.exec(line)
        if (parsed) {
            struct.indent = parsed[1] || ""
            struct.marker = parsed[2] || ""
            struct.check = parsed[3] || ""
            struct.date = parsed[4] || ""
            struct.line = parsed[5] || ""
        }
        return struct
    }

    private lineToString(line: ParsedLine): string {
        let text = `${line.indent}${line.marker}`
        text = line.check ? `${text} ${line.check}` : text
        text = line.date ? `${text} ${line.date}:` : text
        text = `${text} ${line.line}`
        return text
    }

    // TODO: Wrap these parsing actions in a check to see if todo

    toggleDate(line: string): string {
        const parsedLine = this.parseLine(line)
        parsedLine.date = parsedLine.date ? "" : util.getDate()
        return this.lineToString(parsedLine)
    }

    toggleTodo(line: string): string {
        const parsedLine = this.parseLine(line)
        parsedLine.check = parsedLine.check ? "" : "[ ]"
        return this.lineToString(parsedLine)
    }

    toggleDone(line: string): string {
        const parsedLine = this.parseLine(line)
        parsedLine.check = !parsedLine.check ? "[ ]" : parsedLine.check === "[ ]" ? "[x]" : "[ ]"
        return this.lineToString(parsedLine)
    }

    increaseDate(line: string, days: number): string {
        const parsedLine = this.parseLine(line)
        parsedLine.date = !parsedLine.date ? util.getDate() : util.increaseDate(parsedLine.date, days)
        return this.lineToString(parsedLine)
    }

    decreaseDate(line: string, days: number): string {
        const parsedLine = this.parseLine(line)
        parsedLine.date = !parsedLine.date ? util.getDate() : util.decreaseDate(parsedLine.date, days)
        return this.lineToString(parsedLine)
    }

    toTodo(file: path.ParsedPath, line: string, lineNumber: number): TodoItem | undefined {
        // TODO: Generalize this kind of check
        // TODO: Stricter parsing. Do not allow weird marks in todo items for instance.
        // TODO: We could make mark and types configurable by user if we wanted.
        const parsedLine = this.parseLine(line)
        if (parsedLine.check) {
            return {
                mark: parsedLine.check,
                text: parsedLine.line,
                path: path.format(file),
                line: lineNumber,
                file: file.name,
                date: parsedLine.date,
            }
        }
    }
}
