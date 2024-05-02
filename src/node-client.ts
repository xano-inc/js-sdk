import { XanoBaseClient } from "./base-client";

export class XanoNodeClient extends XanoBaseClient {
  protected getFormDataInstance(): any {
    return new (require("form-data"))();
  }

  protected appendFormData(formData: any, key: string, value: any): void {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    formData.append(key, value);
  }
}
