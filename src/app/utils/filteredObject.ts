/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const filteredObject = async (obj: any, parentKey = "", res: any = {}) => {
  for (let key in obj) {
    const propName = parentKey ? `${parentKey}.${key}` : key;
    const value = obj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      filteredObject(value, propName, res);
    } 
    else if (value !== undefined && value !== "") {
      res[propName] = value;
    }
  }
  return res;
};
