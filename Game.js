const isOverNGoals = (limit) => (goals) => (goals > limit);
const isOver25 = isOverNGoals(2.5);
const isOver35  = isOverNGoals(3.5);

export default class Game {
  constructor({score, date, league, home, away}){
    this.score = score;
    this.date = date;
    this.league = league;
    this.away = away;
      this.home = home;

    this._parsedScore = this.constructor.splitScore(score);
    this._homeTeamScore = Game.trimScore(this._parsedScore[0]);
    this._awayTeamScore = Game.trimScore(this._parsedScore[1]);
  }

  static splitScore (score) {
      return (score.includes('(')) ?
            score.substring(0, score.indexOf('(')).split(':') :  score.split(':')
  };

  static trimScore(score) {
      return score && score.trim()
  };

  bothTeamsScored() {
      const home = this._homeTeamScore,
          away = this._awayTeamScore;

      return home !== '0' && away !== '0'
  };

  isOver25() {
      return isOver25(this.totalGoals())
  };

  isOver35(){
    return isOver35(this.totalGoals());
  };

  totalGoals(){
      const home = Number(this._homeTeamScore),
          away = Number(this._awayTeamScore);
      return home + away
  };

  toObject(){
    return {
      home: this.home,
      away: this.away,
      score: this.score,
      date: this.date,
      league: this.league,
      totalGoals: this.totalGoals(),
      isOver : this.isOver25(),
      isUnder: !this.isOver25(),
      bothTeamsScored: this.bothTeamsScored()
    }
  }
}
