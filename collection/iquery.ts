export interface IQuery {
    down: IQuery | null;
    op: string;
    data?: any;
}
