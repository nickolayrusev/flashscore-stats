export default class Game {
  constructor({score, date, league, home, away}){
    this.score = score
    this.date = date
    this.league = league
    this.away = away

    this._parsedScore = this.constructor.splitScore(score),
    this._homeTeamScore = this._parsedScore[0]
    this._awayTeamScore = this._parsedScore[1]
  }

  static splitScore (score) {
      return (score.includes('(')) ?
            score.substring(0, score.indexOf('(')).split(':') :  score.split(':')
  };

  trimScore(score) {
      return score && score.trim()
  };

  bothTeamsScored() {
      let home = this.trimScore(this._homeTeamScore),
          away = this.trimScore(this._awayTeamScore);

      return home !== '0' && away !== '0'
  };

  isOver() {
      return this.totalGoals() > 2.5
  };

  totalGoals(){
      let home = Number(this.trimScore(this._homeTeamScore)),
          away = Number(this.trimScore(this._awayTeamScore));
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
      isOver : this.isOver(),
      isUnder: !this.isOver(),
      bothTeamsScored: this.bothTeamsScored()
    }
  }
}
