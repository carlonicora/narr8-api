import { Injectable, Logger } from "@nestjs/common";

export enum RollResult {
  AstronomicalFailure = "Astronomical Failure",
  CriticalFailure = "Critical Failure",
  Failure = "Failure",
  Success = "Success",
  CriticalSuccess = "Critical Success",
  AstronomicalSuccess = "Astronomical Success",
}

export type Roll = {
  firstRoll: number;
  secondRoll?: number;
  result: RollResult;
  successes?: number;
};

@Injectable()
export class RollService {
  private readonly logger = new Logger(RollService.name);

  roll(params: { proficiency: number }): Roll {
    const firstRoll = Math.floor(Math.random() * 20) + 1;
    const secondRoll = Math.floor(Math.random() * 20) + 1;

    if (firstRoll === 1) {
      if (secondRoll === 1) {
        return {
          firstRoll: firstRoll,
          secondRoll: secondRoll,
          result: RollResult.AstronomicalFailure,
          successes: undefined,
        };
      }

      if (secondRoll < params.proficiency) {
        return {
          firstRoll: firstRoll,
          secondRoll: secondRoll,
          result: RollResult.CriticalFailure,
          successes: undefined,
        };
      }

      return {
        firstRoll: firstRoll,
        secondRoll: secondRoll,
        result: RollResult.Failure,
        successes: 1 - params.proficiency,
      };
    }

    if (firstRoll === 20) {
      if (secondRoll === 20) {
        return {
          firstRoll: firstRoll,
          secondRoll: secondRoll,
          result: RollResult.AstronomicalSuccess,
          successes: undefined,
        };
      }

      if (secondRoll >= params.proficiency) {
        return {
          firstRoll: firstRoll,
          secondRoll: secondRoll,
          result: RollResult.CriticalSuccess,
          successes: undefined,
        };
      }

      return {
        firstRoll: firstRoll,
        secondRoll: secondRoll,
        result: RollResult.Success,
        successes: firstRoll - params.proficiency,
      };
    }

    if (firstRoll >= params.proficiency) {
      return {
        firstRoll: firstRoll,
        result: RollResult.Success,
        successes: firstRoll - params.proficiency,
      };
    }

    return {
      firstRoll,
      result: RollResult.Failure,
      successes: firstRoll - params.proficiency,
    };
  }
}
