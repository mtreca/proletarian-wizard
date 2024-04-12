import * as util from "./util"
import * as path from "path"

export enum TodoView {
    Today,
    Inbox,
    Scheduled,
    Anytime,
    Someday,
}

export interface TodoItem {
    done: boolean
    text: string
    path: string
    line: number
    file: string
    date: string
    wait: boolean
    next: boolean
}

export class TodoGroup {
    constructor(private todos: TodoItem[]) {
        this.todos = todos
    }

    public refresh() {
        this.todos = findAllTodos()
    }

    public get(view?: TodoView): TodoItem[] {
        switch (view) {
            case TodoView.Inbox:
                return this.todos.filter((todo) => todo.file === "Inbox")
            case TodoView.Anytime:
                return this.todos.filter((todo) => todo.file !== "Inbox" && !todo.date && !todo.done && !todo.wait)
            case TodoView.Scheduled:
                return this.todos.filter((todo) => todo.file !== "Inbox" && todo.date && !todo.done && !todo.wait)
            case TodoView.Someday:
                return this.todos.filter((todo) => todo.file !== "Inbox" && !todo.done && todo.wait)
            case TodoView.Today:
                return this.todos.filter(
                    (todo) => todo.file !== "Inbox" && !todo.done && (todo.next || (todo.date && util.isDue(todo.date)))
                )
            default:
                return this.todos
        }
    }
}

interface ParsedLine {
    indent: string
    marker: string
    check: string
    date: string
    next: boolean
    wait: boolean
    line: string
}

export class LineOperations {
    constructor() {}

    private parseLine(line: string): ParsedLine {
        let struct = { indent: "", marker: "", check: "", date: "", next: false, wait: false, line: line }
        const regexp = /^(\s*)?(?:([*-]|\d+\.)\s*)?(?:(\[.?\])\s+)?(?:((?:\d\d\d\d-)?\d\d-\d\d):\s*)?(.+)/
        const parsed = regexp.exec(line)
        if (parsed) {
            struct.indent = parsed[1] || ""
            struct.marker = parsed[2] || ""
            struct.check = parsed[3] || ""
            struct.date = parsed[4] || ""
            struct.line = parsed[5] || ""
            if (struct.line.includes("@next")) {
                struct.next = true
                struct.line = struct.line.replace(" @next", "")
            }
            if (struct.line.includes("@wait")) {
                struct.wait = true
                struct.line = struct.line.replace(" @wait", "")
            }
        }
        return struct
    }

    private lineToString(line: ParsedLine): string {
        let text = `${line.indent}${line.marker}`
        text = line.check ? `${text} ${line.check}` : text
        text = line.date ? `${text} ${line.date}:` : text
        text = `${text} ${line.line}`
        text = line.wait ? `${text} @wait` : text
        text = line.next ? `${text} @next` : text
        return text
    }

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

    toggleWait(line: string): string {
        const parsedLine = this.parseLine(line)
        parsedLine.wait = !parsedLine.wait
        return this.lineToString(parsedLine)
    }

    toggleNext(line: string): string {
        const parsedLine = this.parseLine(line)
        parsedLine.next = !parsedLine.next
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
        const parsedLine = this.parseLine(line)
        if (parsedLine.check) {
            return {
                done: parsedLine.check[1].toLowerCase() === "x",
                text: parsedLine.line,
                path: path.format(file),
                line: lineNumber,
                file: file.name,
                date: parsedLine.date,
                next: parsedLine.next,
                wait: parsedLine.wait,
            }
        }
    }
}

export function findAllTodos(): TodoItem[] {
    const parser = new LineOperations()

    const todos: TodoItem[] = []

    // Actually, only pass the base path, do a recursive search and filter based on base dir
    const files = [...util.getProjectFiles(), util.getInboxFile()]

    files.forEach((filePath) => {
        let fileLines = util.getFileContents(filePath).split("\n")
        let fileTasks = fileLines
            .map((line, number) => parser.toTodo(filePath, line, number))
            .filter((item): item is TodoItem => !!item)
        fileTasks.forEach((task) => {
            todos.push(task)
        })
    })

    return todos
}
