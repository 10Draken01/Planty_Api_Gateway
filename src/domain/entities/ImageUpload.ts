export interface ImageUploadProps {
    id?: string;
    url: string;

}

export class ImageUpload {
    private _id: string;
    private _url: string;


    constructor(props: ImageUploadProps) {
        this._id = props.id!;
        this._url = props.url;
    }

    get id(): string {
        return this._id;
    }
    get url(): string {
        return this._url;
    }

    toJSON() {
        return {
            id: this._id,
            url: this._url,
        };
    }
}