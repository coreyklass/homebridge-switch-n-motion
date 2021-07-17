
import {Service, CharacteristicValue, Characteristic, API, PlatformAccessory, Logger} from 'homebridge';
import {PlatformPlugin} from 'homebridge/lib/api';
import {WithUUID} from 'hap-nodejs/dist/types';
import {ServiceHelper} from './service-helper';
import {OnOffServiceHelper} from './on-off-service-helper';


export class ServiceHelperCollection {


  /**
   * Stores services by key
   * @private
   */
  private readonly _serviceHelpersByKey: any = null;


  /**
   * Constructor
   * @param platform
   * @param api
   * @param log
   * @param accessory
   */
  constructor(private platform: PlatformPlugin,
              private api: API,
              private log: Logger,
              private accessory: PlatformAccessory) {
    this._serviceHelpersByKey = {};
  }


  /**
   * Returns the Service Helper for the given key
   * @param key
   */
  serviceHelperForKey(key: string): ServiceHelper | null {
    return (this._serviceHelpersByKey[key] as ServiceHelper | null);
  }


  /**
   * Stores a Service Helper by key
   * @param key
   * @param helper
   */
  setServiceHelperForKey(key: string, helper: ServiceHelper) {
    this._serviceHelpersByKey[key] = helper;
  }





  /**
   * Returns the Service for the given key
   * @param key
   */
  serviceForKey(key: string): Service | null {
    const helper = this.serviceHelperForKey(key);

    return (helper ? helper.service : null);
  }




  /**
   * Retrieves the characteristic for the specified service key
   * @param key
   * @param characteristic
   */
  getCharacteristicForKey(key: string, characteristic: WithUUID<{ new (): Characteristic }>): Characteristic | null {
    const serviceHelper = this.serviceHelperForKey(key);

    return (serviceHelper ? serviceHelper.service.getCharacteristic(characteristic) : null);
  }



  /**
   * Sets the characteristic for the specified service key
   * @param key
   * @param characteristic
   * @param value
   */
  setCharacteristicForKey(key: string, characteristic: WithUUID<{ new (): Characteristic }>, value: CharacteristicValue) {
    const serviceHelper = this.serviceHelperForKey(key);

    if (serviceHelper) {
      serviceHelper.service.setCharacteristic(characteristic, value);
    }
  }






  /**
   * Retrieves the characteristic for the specified service key
   * @param key
   * @param characteristic
   */
  getCharacteristicValueForKey(key: string, characteristic: WithUUID<{ new (): Characteristic }>): CharacteristicValue | null {
    const serviceCharacteristic = this.getCharacteristicForKey(key, characteristic);

    return (serviceCharacteristic ? serviceCharacteristic.value : null);
  }



  /**
   * Sets the characteristic for the specified service key
   * @param key
   * @param characteristic
   * @param value
   */
  setCharacteristicValueForKey(key: string, characteristic: WithUUID<{ new (): Characteristic }>, value: CharacteristicValue) {
    const serviceCharacteristic = this.getCharacteristicForKey(key, characteristic);

    if (serviceCharacteristic) {
      serviceCharacteristic.updateValue(value);
    }
  }





  /**
   * Creates a new On/Off Service Helper
   * @param key
   * @param serviceIdentifier
   * @param serviceType
   */
  newOnOffServiceHelper(key: string, serviceIdentifier: string, serviceType: Service | typeof Service): OnOffServiceHelper {
    const helper = new OnOffServiceHelper(this.api, this.log, this.accessory, serviceIdentifier, serviceType);

    this._serviceHelpersByKey[key] = helper;

    return helper;
  }






}
