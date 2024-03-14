import { IPicGo } from "../../types";
export interface ISignature {
    signature: string;
    appId: string;
    bucket: string;
    signTime: string;
}
export default function register(ctx: IPicGo): void;
