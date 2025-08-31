import { v4 } from 'uuid';

export default function uuid<T>(): T {
  return v4() as T;
}
