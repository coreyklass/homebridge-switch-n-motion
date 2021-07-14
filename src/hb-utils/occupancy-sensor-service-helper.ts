import {ServiceHelper} from './service-helper';
import {API, Characteristic, PlatformAccessory} from 'homebridge';
import EventEmitter from 'events';
import {WithUUID} from 'hap-nodejs/dist/types';

export class OccupancySensorServiceHelper extends ServiceHelper {



  /**
   * Shortcut to the Occupancy characteristic
   * @private
   */
  private get occupancyCharacteristic(): WithUUID<{ new (): Characteristic }> {
    return this.api.hap.Characteristic.OccupancyDetected;
  }



  /**
   * Returns the OccupancyDetected state of the switch
   */
  get occupancyState(): boolean {
    return (this.service.getCharacteristic(this.occupancyCharacteristic).value as boolean);
  }


  /**
   * Sets the OccupancyDetected state of the motion sensor
   * @param value
   */
  set occupancyState(value: boolean) {
    this.service.getCharacteristic(this.occupancyCharacteristic).updateValue(value);
  }


  /**
   * Event Emitter for when the state changes
   */
  onStateUpdateEvent = new EventEmitter();


  /**
   * Constructor
   * @param api
   * @param accessory
   * @param serviceIdentifier
   */
  constructor(api: API,
              accessory: PlatformAccessory,
              serviceIdentifier: string
  ) {
    super(api, accessory, serviceIdentifier, api.hap.Service.OccupancySensor);

    this.service.getCharacteristic(this.occupancyCharacteristic)
        ?.onSet(this.didChangeOccupancyState.bind(this))
        ?.onGet(this.didRequestOccupancyState.bind(this));
  }


  /**
   * Occupancy state was requested
   * @private
   */
  private didRequestOccupancyState(): boolean {
    return this.occupancyState;
  }



  /**
   * If the Occupancy state changed
   * @private
   */
  private didChangeOccupancyState() {
    this.onStateUpdateEvent.emit('OccupancyDetected', this.occupancyState);
  }







}
