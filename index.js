import fetch from 'node-fetch'
import $ from 'cheerio'
import fs from 'fs'
import {inspect} from 'util'
import _ from 'lodash'

/**
 * [{id:'lalala', state:'n/a'}]
 * @returns {Promise.<*|Array>}
 */
const fetchGames = async () => {
    let result = await fetch('http://www.flashscore.mobi/').then(r => r.text());
    let ids = $('div[id=score-data] > a', result).map((i, e) => {
            let championship = $(e).prevAll('h4').first().text();
            return {
                id: $(e).attr('href'),
                state: $(e).text(),
                isLive: $(e).attr('class') === 'live',
                championship: championship
            }
        }
    ).get();
    return ids.map(e => ({id: e.id.substring(7, 15), status: e.state, isLive: e.isLive, championship: e.championship}))
};

/**
 *
 * @param ids
 * @param all
 * @returns {Array}
 */
const fetchHeadToHeadFeed = (ids, all = false) => {
    if (!all)
        ids = ids.slice(0, 5)
    return ids.map(i => {
        const id = i.id,
            state = i.status,
            isLive = i.isLive,
            championship = i.championship;

        const HEAD_TO_HEAD_FEED = `http://d.flashscore.com/x/feed/d_hh_${id}_en_1`;
        return fetch(HEAD_TO_HEAD_FEED, {headers: {'X-Fsign': 'SW9D1eZo'}}).then(r => r.text()).then(text => ({
            text,
            id,
            state,
            isLive,
            championship
        }))
    })
};

const extractHeadToHead = (html, state, isLive, championship) => {
    return $('#tab-h2h-overall .h2h_mutual', html).map((i, e) => {
        let title = $('table thead > tr', e).text().substring('Head-to-head matches: '.length);

        let games = $('table tbody > tr', e).map((ri, r) => {
            let cols = $('td', r);
            if (cols.length > 1)
                return {
                    date: $(cols[0]).text(),
                    league: $(cols[1]).text(),
                    home: $(cols[2]).text(),
                    away: $(cols[3]).text(),
                    score: $(cols[4]).text()
                };
        }).get();
        return {title, games, state, isLive, championship}
    }).get()[0]
};

const splitScore = (score) => {
    if (score.includes('(')) {
        return score.substring(0, score.indexOf('(')).split(':')
    }
    return score.split(':')
};

const trimScore = (score) => {
    return score && score.trim()
}

let bothTeamsScored = (game) => {
    const score = splitScore(game.score);
    let home = trimScore(score[0]),
        away = trimScore(score[1]);

    return home !== '0' && away !== '0'
};

let isOver = (game) => {
    return totalGoals(game) > 2.5
};

let totalGoals = (game) => {
    const score = splitScore(game.score);
    let home = Number(trimScore(score[0])),
        away = Number(trimScore(score[1]));
    return home + away
};

const computeStats = (game, size = 5) => {
    let games = game.games.slice(0, size).map((g) => {
        return {
            ...g,
            isOver: isOver(g),
            isUnder: !isOver(g),
            bothTeamsScored: bothTeamsScored(g),
            totalGoals: totalGoals(g)
        }
    });

    return {
        ...game,
        games: games,
        overPercentage: games.length === 0 ? '0%' : Math.round(games.filter(g => g.isOver).length / games.length * 100) + '%',
        underPercentage: games.length === 0 ? '0%' : Math.round(games.filter(g => g.isUnder).length / games.length * 100) + '%',
        bothTeamsToScorePercentage: games.length === 0 ? '0%' : Math.round(games.filter(g => g.bothTeamsScored).length / games.length * 100) + '%',
        averageGoals: games.length === 0 ? '0%' : Math.round(_.sum(games.map(t => t.totalGoals)) / games.length),
        size: games.length
    }
};

(async () => {
    let ids = await fetchGames();
    let result = await Promise.all(fetchHeadToHeadFeed(ids, true));
    console.log('result is ', result.length);

    const obj = result.reduce((i, n) => {
        let stats = computeStats(extractHeadToHead(n.text, n.state, n.isLive, n.championship))
        return [...i, stats]
    }, []);

    fs.writeFile('result' + '.json', JSON.stringify(obj), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was written!");
    });

})();
