export type ChartRect = {
    w?: number | string;
    h?: number | string;
    ts?: number | string;
    rs?: number | string;
    rx?: number;
    ry?: number;
    fill: string;
    debug?: boolean;
    filter?: string;
    label?: LabelAlignment;
};


export type BaseLabelAlignment = `${"start-inset" | "start-outset" | "middle" | "end-outset" | "end-inset"}${"" | `:${number}`}`;

export type LabelAlignment = {
    y: BaseLabelAlignment;
    x: BaseLabelAlignment;
}