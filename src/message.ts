// SPDX-License-Identifier: MIT

// 定义了扩展端和 webview 端传递消息的格式以及数据类型。

export enum MessageType {
    // 由 webview 发起的消息
    refresh = 'refresh',
    
    // 由扩展端发起的请求
    file = 'file',
    end = 'end',
}

export interface Message {
    type: MessageType;
    data: undefined | FileTypes;
}

export interface FileTypes {
    types: Array<FileType>;
    total: FileType;
}

/**
 * 表示各个文件类型的统计信息
 */
export class FileType {
    name: string = ''; // 类型，一般为扩展名
    files: number = 0; // 文件数量
    lines: number = 0; // 总行数
    max: number = 0;
    min: number = Number.POSITIVE_INFINITY;
    avg: number = 0;
}