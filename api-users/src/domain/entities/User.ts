export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  orchards_id?: string[];
  count_orchards?: number;
  experience_level?: 1 | 2 | 3;
  profile_image?: string;
  createdAt?: Date;
  historyTimeUse_ids?: Date[];

}

export class User {
  private _id: string;
  private _name: string;
  private _email: string;
  private _password: string;
  private _orchards_id: string[];
  private _count_orchards: number;
  private _experience_level: 1 | 2 | 3;
  private _profile_image: string;
  private _createdAt: Date;
  private _historyTimeUse_ids: Date[];


  constructor(props: UserProps) {
    this._id = props.id || this.generateId();
    this._name = props.name;
    this._email = props.email;
    this._password = props.password;
    this._orchards_id = props.orchards_id || [];
    this._count_orchards = props.count_orchards || 0;
    this._experience_level = props.experience_level || 1;
    this._profile_image = props.profile_image || 'https://imgs.search.brave.com/4UEc9qL-ya5yCbrX6t3vwBJRKoFVHndy9k0d9DuWMJY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9oaXBz/LmhlYXJzdGFwcHMu/Y29tL2htZy1wcm9k/L2ltYWdlcy9zd2Vl/dC1wb3RhdG8tcGxh/bnQtcm95YWx0eS1m/cmVlLWltYWdlLTE3/NDI0MjMxMDIucGpw/ZWc_Y3JvcD0wLjY2/OHh3OjEuMDB4aDsw/LjAyMDR4dyww';
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

  get orchards_id(): string[] | undefined {
    return this._orchards_id ? [...this._orchards_id] : undefined;
  }

  get count_orchards(): number | undefined {
    return this._count_orchards;
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

  get historyTimeUse_ids(): Date[] {
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
      orchards_id: this._orchards_id,
      count_orchards: this._count_orchards,
      experience_level: this._experience_level,
      profile_image: this._profile_image,
      createdAt: this._createdAt,
      historyTimeUse_ids: this._historyTimeUse_ids
    };
  }
}