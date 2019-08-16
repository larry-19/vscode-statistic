// SPDX-License-Identifier: MIT

import * as path from 'path';
import * as filesystem from 'fs';
import * as locale from './locale';
import * as vcs from './vcs/vcs';

const fs = filesystem.promises;

/**
 * 项目的统计信息
 */
export default class Project {
    vcs: vcs.VCS;
    name: string;
    path: string;

    /**
     * 构造函数
     * @param p 项目地址
     */
    constructor(p: string) {
        this.vcs = vcs.New(p);
        this.path = p;
        this.name = path.basename(p);
    }

    /**
     * 加载项目下的每一个文件的统计信息
     */
    private async countLines(): Promise<File[]> {
        const files = await this.vcs.files();

        const fs = await Promise.all(files.map((path)=>{
            return this.countFileLines(path);
        }));

        return fs.sort((v1: File, v2: File) => {
            return v2.lines - v1.lines;
        });
    }

    /**
     * 计算指定文件的行数
     *
     * @param path 文件路径
     */
    private async countFileLines(path: string): Promise<File> {
        const file = new (File);
        file.path = path;

        const content = (await fs.readFile(path)).toString();
        file.lines = content.split('\n').length;

        return file;
    }

    /**
     * 获取各类文件的行数信息
     * 
     * @returns 返回为一个 Promise，附加一个 tuple，
     * 第一个参数为各个类型的行数信息列表，第二个参数合计的单行数据。
     */
    public async types(): Promise<[Type[], Type]> {
        const types = this.buildTypes(await this.countLines());
        const sumType = this.buildSumType(types);
        return [types, sumType];
    }

    /**
     * 计算 types
     */
    private buildTypes(files: File[]): Type[] {
        const types: Types = {};
        for (const file of files) {
            let name = path.extname(file.path);
            if (name === '') {
                name = path.basename(file.path);
            }

            let t = types[name];
            if (t === undefined) {
                t = new Type();
                t.name = name;
                types[name] = t;
            }

            t.files++;
            t.lines += file.lines;
            if (t.max < file.lines) {
                t.max = file.lines;
            }
            if (t.min > file.lines) {
                t.min = file.lines;
            }
        }

        const ts: Type[] = [];
        for (const key in types) {
            const t = types[key];
            t.avg = Math.floor(t.lines / t.files);
            ts.push(t);
        }

        return ts.sort((v1: Type, v2: Type) => {
            return v2.lines - v1.lines;
        });
    }

    private buildSumType(types: Type[]): Type {
        const sumType = new Type();
        sumType.name = locale.l('sum');
        for (const t of types) {
            sumType.files += t.files;
            sumType.lines += t.lines;

            if (sumType.max < t.max) {
                sumType.max = t.max;
            }

            if (sumType.min > t.min) {
                sumType.min = t.min;
            }
        }
        sumType.avg = Math.floor(sumType.lines / sumType.files);

        return sumType;
    }
}

interface Types {
    [index: string]: Type;
}

/**
 * 表示各个文件类型的统计信息
 */
export class Type {
    name: string = ''; // 类型，一般为扩展名
    files: number = 0; // 文件数量
    lines: number = 0; // 总行数
    max: number = 0;
    min: number = Number.POSITIVE_INFINITY;
    avg: number = 0;
}

/**
 * 每一个文件统计信息
 */
class File {
    path: string = ''; // 文件名
    lines: number = 0; // 总行数
}
