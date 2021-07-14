
import {Service, CharacteristicValue, Characteristic, API, PlatformAccessory, DynamicPlatformPlugin} from 'homebridge';
import {PlatformPlugin} from 'homebridge/lib/api';
import {WithUUID} from 'hap-nodejs/dist/types';
import {ServiceHelper} from './service-helper';
import {SwitchServiceHelper} from './switch-service-helper';
import {OccupancySensorServiceHelper} from './occupancy-sensor-service-helper';


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
   * @param accessory
   */
  constructor(private platform: PlatformPlugin,
              private api: API,
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
   * Creates a new Switch Service Helper
   * @param key
   * @param serviceIdentifier
   */
  newSwitchServiceHelper(key: string, serviceIdentifier: string): SwitchServiceHelper {
    const helper = new SwitchServiceHelper(this.api, this.accessory, serviceIdentifier);

    this._serviceHelpersByKey[key] = helper;

    return helper;
  }


  /**
   * Creates a new Occupancy Sensor Service Helper
   * @param key
   * @param serviceIdentifier
   */
  newOccupancySensorServiceHelper(key: string, serviceIdentifier: string): OccupancySensorServiceHelper {
    const helper = new OccupancySensorServiceHelper(this.api, this.accessory, serviceIdentifier);

    this._serviceHelpersByKey[key] = helper;

    return helper;
  }



}
