import {parseForMongoDBUrls} from './parseForMongodbUrls'
import { parseForPrivateKeys } from './parseForPrivateKeys'


// just find keys dont do shit with them it adds complexity
// at the end this function will return an object where each
// where each key represents a different parsed extraction
const cardNumRegx = "^[0-9]{16}$";
export const parseFile = file => {
    let privateKeys = parseForPrivateKeys(file)
    return privateKeys
  }

  