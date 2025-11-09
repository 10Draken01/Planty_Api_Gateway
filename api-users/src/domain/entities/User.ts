export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  orchards_id?: string[];  
  count_orchards?: number; 
  experience_level?: number; 
  profile_image?: string;  
  createdAt?: Date;   
  historyTimeUse_ids?: string[]; 

}

export class User {
  private _id: string;
  private _name: string;
  private _email: string;
  private _password: string;
  private _experience_level: number;
  private _profile_image?: string;
  private _createdAt: Date;
  private _historyTimeUse_ids: string[];


  constructor(props: UserProps) {
    this._id = props.id || this.generateId();
    this._name = props.name;
    this._email = props.email;
    this._password = props.password;
    this._experience_level = props.experience_level || 1; 
    this._profile_image = props.profile_image;
    this._createdAt = props.createdAt || new Date();
    this._historyTimeUse_ids = props.historyTimeUse_ids || [];
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get experience_level(): number {
    return this._experience_level;
  }

  get profile_image(): string | undefined {
    return this._profile_image;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get historyTimeUse_ids(): string[] {
    return [...this._historyTimeUse_ids]; 
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      experience_level : this._experience_level,
      profile_image: this._profile_image,
      createdAt: this._createdAt,
      historyTimeUse_ids: this._historyTimeUse_ids
    };
  }
}