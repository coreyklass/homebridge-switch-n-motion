
export class HBTimer {


  /**
   * Timeout for the timer
   * @private
   */
  private _timerTimeout: any | null = null;




  /**
   * End date for the timer
   * @private
   */
  private _timerEndDate: Date | null = null;




  /**
   * Returns the timer end date
   */
  get timerEndDate(): Date | null {
    return (this._timerEndDate ? new Date(this._timerEndDate.getTime()) : null);
  }





  /**
   * Resets the timer
   * @param handler
   * @param timerMS
   */
  resetTimer(handler: (() => void), timerMS: number) {
    this.clearTimer();

    const now = new Date();
    const timerEndDate = new Date(now.getTime() + timerMS);

    this._timerTimeout = setTimeout(() => {
      this._timerEndDate = null;

      handler();
    }, timerMS);

    this._timerEndDate = timerEndDate;
  }




  /**
   * Resets the timer with an end date instead of duration
   * @param handler
   * @param timerEndDate
   */
  resetTimerWithEndDate(handler: (() => void), timerEndDate: Date) {
    this.clearTimer();

    const now = new Date();
    const timerMS = timerEndDate.getTime() - now.getTime();

    if (timerMS > 0) {
      this._timerTimeout = setTimeout(() => {
        this._timerEndDate = null;

        handler();
      }, timerMS);

      this._timerEndDate = timerEndDate;
    }
  }





  /**
   * Clears the timer
   */
  clearTimer() {
    if (this._timerTimeout) {
      clearTimeout(this._timerTimeout);
    }

    if (this._timerEndDate) {
      this._timerEndDate = null;
    }
  }




}
