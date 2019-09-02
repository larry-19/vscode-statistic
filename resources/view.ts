// SPDX-License-Identifier: MIT

declare var acquireVsCodeApi: any;

class View {
    private div: HTMLElement;
    private table: HTMLTableElement;
    private nodata: HTMLElement;

    private locale: string;
    private numberFormat: Intl.NumberFormat;
    private collator: Intl.Collator;

    private vscode = acquireVsCodeApi();

    constructor() {
        this.div = $('#file-types') as HTMLElement;
        this.table = this.div.querySelector('table') as HTMLTableElement;
        this.nodata = this.div.querySelector('.no-data') as HTMLElement;

        this.locale = $('html').getAttribute('lang') as string;
        this.numberFormat = new Intl.NumberFormat(this.locale);
        this.collator = new Intl.Collator(this.locale);

        this.initSortTable();

        this.vscode.postMessage({
            type: 'refresh',
        });
        window.addEventListener('message', this.processMessage.bind(this));
    }

    private processMessage(e: MessageEvent) {
        const msg = e.data as Message;
        switch (msg.type) {
            case 'file':
                for (const type of (msg.data as FileType[])) {
                    this.appendFileType(type);
                }
                break;
            case 'end':
                this.end();
                break;
            default:
                throw new Error(`无效的消息类型${msg.type}`);
        }
    }

    private end() {
        const obj = {
            files: 0,
            lines: 0,
            comments: 0,
            blanks: 0,
            max: 0,
            min: Number.POSITIVE_INFINITY,
            avg: 0,
        };

        const trs = this.table.querySelectorAll('tbody>tr');
        if (trs.length === 0) {
            this.showMessage();
            return;
        }

        trs.forEach((tr) => {
            const tds = tr.querySelectorAll('td');
            obj.files += getValue(tds[0]);
            obj.lines += getValue(tds[1]);
            obj.comments += getValue(tds[2]);
            obj.blanks += getValue(tds[3]);

            const max = getValue(tds[5]);
            if (max > obj.max) {
                obj.max = max;
            }
            const min = getValue(tds[6]);
            if (min < obj.min) {
                obj.min = min;
            }
        });
        obj.avg = Math.floor(obj.lines / obj.files);

        $('#files').innerHTML = this.fmtNumber(obj.files);
        $('#lines').innerHTML = this.fmtNumber(obj.lines);
        $('#comments').innerHTML = this.fmtNumber(obj.comments);
        $('#blanks').innerHTML = this.fmtNumber(obj.blanks);
        $('#avg').innerHTML = this.fmtNumber(obj.avg);
        $('#max').innerHTML = this.fmtNumber(obj.max);
        $('#min').innerHTML = this.fmtNumber(obj.min);
    }

    /**
     * 将 type 添加到表格中
     * 
     * 如果名称已经存在，则是修改已有的数据；否则为添加新的元素。
     * 根据 type.name 和 tbody>tr>th.name 是否相同判断是否为同一元素。
     */
    private appendFileType(type: FileType) {
        const tbody = this.table.querySelector('tbody');
        if (tbody === null) {
            throw new Error(`元素 tbody 不存在`);
        }

        const th = tbody.querySelector(`th[data-value="${type.name}`);
        if (th === null) { // 不存在
            const tr = tbody.appendChild(document.createElement('tr'));
            this.appendFileTypeToTr(tr, type);
            return;
        }

        const tr = th.parentNode;
        if (tr === null) {
            throw new Error(`元素 ${type.name} 的父元素不存在`);
        }

        const tds = tr.querySelectorAll('td');
        this.addValueOfTd(tds[0], type.files);
        this.addValueOfTd(tds[1], type.lines);
        this.addValueOfTd(tds[2], type.comments);
        this.addValueOfTd(tds[3], type.blanks);
        this.addValueOfTd(tds[4], Math.floor(type.lines / type.files));

        if (getValue(tds[5]) < type.max) {
            this.addValueOfTd(tds[5], type.max);
        }

        if (getValue(tds[6]) > type.min) {
            this.addValueOfTd(tds[6], type.min);
        }
    }

    private appendFileTypeToTr(tr: HTMLTableRowElement, type: FileType) {
        const th = tr.appendChild(document.createElement('th'));
        th.append(type.name);
        th.setAttribute('data-value', type.name);

        this.appendValueToTr(tr, type.files);
        this.appendValueToTr(tr, type.lines);
        this.appendValueToTr(tr, type.comments);
        this.appendValueToTr(tr, type.blanks);
        this.appendValueToTr(tr, Math.floor(type.lines / type.files));
        this.appendValueToTr(tr, type.max);
        this.appendValueToTr(tr, type.min);
    }

    /**
     * 将 value 作为 td 元素的内容添加到 tr 中
     * 
     * 会同时更新 data-value 属性和 innerHTML 值。
     * 其中 innerHTML 中为根据本地格式化之后的值。
     * @param tr 
     * @param value 
     */
    private appendValueToTr(tr: HTMLTableRowElement, value: number) {
        const elem = tr.appendChild(document.createElement('td'));
        elem.append(this.fmtNumber(value));
        elem.setAttribute('data-value', value.toString());
    }

    /**
     * 将 td 的值加上 value
     * 
     * 会同时更新 data-value 属性和 innerHTML 值。
     * 其中 innerHTML 中为根据本地格式化之后的值。
     *
     * @param value 新添加的值
     */
    private addValueOfTd(td: HTMLTableCellElement, value: number) {
        let v = getValue(td);
        v += value;

        td.setAttribute('data-value', v.toString());
        td.innerHTML = this.fmtNumber(v);
    }

    /**
     * 是否显示没有数据的提示
     * 
     * @param reason 如果提供了此值，则会将其打印到 console.error
     */
    private showMessage(reason?: string) {
        this.table.style.display = 'none';
        this.nodata.style.display = 'block';

        if (reason !== undefined) {
            console.error(reason);
        }
    }

    /**
     * 以本地化的格式返回数值
     *
     * @param val 需要格式化的数值
     */
    private fmtNumber(val: number): string {
        return this.numberFormat.format(val);
    }

    /**
     * 对所有的 table 元素添加排序功能
     * 
     * 目前支持在 thead>th 上使用以下几种自定义功能：
     * - data-asc 表示当前列为升序排列，可手动指一列；
     * - data-type 表示该列的值类型，可以是 string 和 number，
     *   默认为 number，该属性会影响排序方式；
     * - data-index 由代码自动生成，无需也不能人工干预；
     */
    private initSortTable() {
        const ths = this.table.querySelectorAll('thead>tr>th');
        ths.forEach((th, index) => {
            th.setAttribute('data-index', index.toString());
            th.addEventListener('click', (e) => {
                const th = e.target as HTMLTableHeaderCellElement;
                const asc = !(/true/.test(th.getAttribute('data-asc') as string));
                const index = parseInt(th.getAttribute('data-index') as string);
                th.setAttribute('data-asc', asc ? 'true' : 'false');

                if (th.getAttribute('data-type') === 'string') {
                    this.sortTable(index, asc, 'string');
                } else {
                    this.sortTable(index, asc, 'number');
                }

                // 去掉其它元素的 asc 属性
                const parent = th.parentNode;
                if (parent === null) {
                    throw new Error('th 不存在父元素');
                }
                parent.querySelectorAll('th').forEach((val, i) => {
                    if (index !== i) {
                        val.setAttribute('data-asc', 'none');
                    }
                });
            }); // end onclick
        });
    }

    /**
     * 对表进行排序，仅处理 tbody 中的内容
     *
     * @param {number} colIndex 按第几列进行排序
     * @param {boolean} asc 是否倒序
     * @param {string} string 比较类型，目前支持 string 或是 number
     */
    private sortTable(colIndex: number, asc: boolean, type: string) {
        let rows: HTMLTableRowElement[] = [];

        this.table.querySelectorAll('tbody>tr').forEach((row) => {
            rows.push(row as HTMLTableRowElement);
        });


        rows = rows.sort((row1, row2) => {
            const cell1 = row1.cells.item(colIndex) as HTMLTableCellElement;
            const cell2 = row2.cells.item(colIndex) as HTMLTableCellElement;

            let v1 = cell1.getAttribute('data-value');
            let v2 = cell2.getAttribute('data-value');

            if (!asc) {
                [v1, v2] = [v2, v1];
            }

            switch (type) {
                case 'string':
                    return this.collator.compare(v1 as string, v2 as string);
                case 'number':
                    return numberCompare(v1 as string, v2 as string);
                default:
                    throw new Error(`无效的 type 值 ${type}`);
            }
        });

        const p = rows[0].parentNode as HTMLTableRowElement;
        for (const row of rows) {
            p.appendChild(row);
        }
    }
}



/**
 * 获取 elem 上的 data-value 的值，并转换成数值。
 */
function getValue(elem: Element): number {
    const v = elem.getAttribute('data-value');
    if (v === null) {
        return 0;
    }

    return parseInt(v);
}

function $(selector: string): Element {
    const elem = document.querySelector(selector);
    if (elem === null) {
        throw new Error(`元素 ${selector} 不存在`);
    }

    return elem;
}

function $$(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
}

interface Message {
    type: string;
    data: FileType[] | undefined;
}

interface FileType {
    name: string;
    files: number;
    lines: number;
    blanks: number;
    comments: number;
    max: number;
    min: number;
}


function numberCompare(v1: string, v2: string) {
    return parseInt(v1) - parseInt(v2);
}

window.addEventListener('load', (e: Event) => {
    try {
        const v = new View();
    } catch (e) {
        console.error(e);
    }
});