var NEWS_API_KEY = "b8e5013c-f10c-474c-9cf6-b9416ae989ef";
var getTeamNewsQueryURL = "https://content.guardianapis.com/search?section=football&page-size=50&api-key=";
var API_KEY = "43d2319104c54b0c9cf2d5679ab2ae5d";
var getTeamsQueryURL = "https://api.football-data.org/v1/competitions/426/leagueTable";
var teams = [];
var eplData = [];
var standing = [];
var newsArray = [];
var badges = [
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t3.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t91.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t90.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t8.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t31.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t11.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t88.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t13.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t14.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t43.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t1.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t25.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t20.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t110.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t56.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t80.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t6.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t57.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t35.svg",
  "https://platform-static-files.s3.amazonaws.com/premierleague/badges/t21.svg"
];

/**
 * Make football-data API call, and once done, get jokecamp JSON. Put all
 * necessary data in variables and create DOM elements
 */
$.ajax({
  headers: { 'X-Auth-Token': API_KEY },
  url: getTeamsQueryURL,
  dataType: 'json',
  type: 'GET'
}).done(function(response) {
  standing = response.standing;
  console.log(standing);

  $.ajax({
    url: getTeamNewsQueryURL + NEWS_API_KEY,
    method: "GET"
  }).done(function(response) {
    newsArray = response.response.results;
    console.log(newsArray);

    $.ajax({
      url: "https://jokecamp.github.io/epl-fantasy-geek/js/static-data.json",
      method: "GET"
    }).done(function(response) {
      console.log(response);
      teams = response.teams;
      eplData = response.elements;

      $.each(teams, function(index, team) {
        teams[index].crestUrl = badges[index];

        // rename team names in teams array to match
        // team names from football-data api response.
        // TOT, MANU, and MANCity are special cases
        if (teams[index].name === "Spurs") {
          teams[index].name = "Tottenham Hotspur FC";
        } else if (teams[index].name === "Man Utd") {
          teams[index].name = "Manchester United FC";
        } else if (teams[index].name === "Man City") {
          teams[index].name = "Manchester City FC";
        } else {
          $.each(standing, function(i, val) {
            if (val.teamName.toLowerCase().includes(team.name.toLowerCase())) {
              teams[index].name = val.teamName;
              return false;
            }
          });
        }
      });

      setTeamsTag();

      console.log(teams);

      createTeamsNav();
    });
  });
});

/**
 * Creates the teams navbar and each team's on click event handler
 */
function createTeamsNav() {
  var mainDiv = $("#clubs");
  $("#club-navbar").empty();

  $.each(teams, function(index, team) {
    var teamBadge = $('<div class="item" id=' + team.short_name + '><img class="badge-icon" src="' + team.crestUrl + '"></div>');

    $("#club-navbar").append(teamBadge);

    teamBadge.on("click", function() {
      $('.ui .item').removeClass('active');
      $(this).addClass('active');
      var teamId = $(this).attr("id");

      createTeamsPage(teamId);
    });
  });

  $("#club-navbar").appendTo("#nav-container");
}

function createTeamsPage(teamId) {
  var teamCode = getTeamCode(teamId);
  // get team function
  var contentContainer = $("#content-container");
  // contentContainer.empty();

  // INJURIES BOX
  $("#injuries-content").empty();
  var playerName = undefined;
  $.each(eplData, function(index, player) {
    if (player.team_code === teamCode) {
      if (player.status === "i" || player.status === "d") {
        playerName = $('<h2 class="ui sub header">' + player.first_name + ' ' + player.second_name + '</h4>');
        $("#injuries-content").append(playerName);

        var injuryInfo = $('<div>' + player.news + '</div>');
        $("#injuries-content").append(injuryInfo);
      }
    }
  });

  if (playerName === undefined) {
    playerName = $('<h4 class="ui sub header">No Injuries</h4>');
    $("#injuries-content").append(playerName);
  }

  // GENERAL INFORMATION BOX
  $("#team-info-content").empty();
  // TOP SCORER

  var topScorerData = getTopScorer(teamId);
  var topScorerLabel = $('<h2 class="ui sub header">Top Scorer(s)</h2>');
  $("#team-info-content").append(topScorerLabel);
  for (var i = 0; i < topScorerData[0].length; i++) {
    var topScorer = $('<div>' + topScorerData[0][i] + ': ' + topScorerData[1] + ' goals</div>');
    $("#team-info-content").append(topScorer);
  }

  // CLEAN SHEETS
  var cleanSheetsData = getCleanSheets(teamId);
  var cleanSheetsLabel = $('<h2 class="ui sub header">Clean Sheets: ' + cleanSheetsData + '</h2>');
  $("#team-info-content").append(cleanSheetsLabel);

  // HOME RECORD
  var homeRecordLabel = $('<h2 class="ui sub header">Home Record</h2>');
  $("#team-info-content").append(homeRecordLabel);
  $.each(standing, function(index, team) {
    if (team.teamName.toLowerCase().includes(getTeamName(teamId).toLowerCase())) {
      var homeWins = $('<div>Wins: ' + team.home.wins + '</div>');
      $("#team-info-content").append(homeWins);
      var homeLosses = $('<div>Losses: ' + team.home.losses + '</div>');
      $("#team-info-content").append(homeLosses);
      var homeDraws = $('<div>Draws: ' + team.home.draws + '</div>');
      $("#team-info-content").append(homeDraws);
      var homeGoalsScored = $('<div>Goals Scored: ' + team.home.goals + '</div>');
      $("#team-info-content").append(homeGoalsScored);
      var homeGoalsAgainst = $('<div>Goals Against: ' + team.home.goalsAgainst + '</div>');
      $("#team-info-content").append(homeGoalsAgainst);
    }
  });

  // AWAY RECORD
  var awayRecordLabel = $('<h2 class="ui sub header">Away Record</h2>');
  $("#team-info-content").append(awayRecordLabel);
  $.each(standing, function(index, team) {
    if (team.teamName.toLowerCase().includes(getTeamName(teamId).toLowerCase())) {
      var awayWins = $('<div>Wins: ' + team.away.wins + '</div>');
      $("#team-info-content").append(awayWins);
      var awayLosses = $('<div>Losses: ' + team.away.losses + '</div>');
      $("#team-info-content").append(awayLosses);
      var awayDraws = $('<div>Draws: ' + team.away.draws + '</div>');
      $("#team-info-content").append(awayDraws);
      var awayGoalsScored = $('<div>Goals Scored: ' + team.away.goals + '</div>');
      $("#team-info-content").append(awayGoalsScored);
      var awayGoalsAgainst = $('<div>Goals Against: ' + team.away.goalsAgainst + '</div>');
      $("#team-info-content").append(awayGoalsAgainst);
    }
  });

  // STANDINGS
  $("#table-standings-content").empty();
  $.each(standing, function(index, team) {
    var tr = $('<tr>');
    if (team.teamName.toLowerCase().includes(getTeamName(teamId).toLowerCase())) {
      tr.addClass("negative");
    }
    var td = $('<td>' + team.position + '</td><td class="mobile-table">' +
                        team.teamName + '</td><td class="desktop-table">' +
                        getTeamId(team.teamName) + '</td><td>' +
                        team.playedGames + '</td><td>' +
                        team.wins + '</td><td>' +
                        team.draws + '</td><td>' +
                        team.losses + '</td><td>' +
                        team.goals + '</td><td>' +
                        team.goalsAgainst + '</td><td class="mobile-table">' +
                        team.goalDifference + '</td><td>' +
                        team.points + '</td>');

    td.appendTo(tr);
    $("#table-standings-content").append(tr);
  });

  // NEWS
  $("#team-news-content").empty();
  var articleLabel = undefined;

  $.each(newsArray, function(index, newsArticle) {
    var tags = getTeamTags(teamId);

    $.each(tags, function(i, tag) {
      if (newsArticle.webTitle.toLowerCase().includes(tag.toLowerCase()) ||
          newsArticle.webUrl.toLowerCase().includes(tag.toLowerCase())) {
        articleLabel = $('<h2 class="ui sub header">' + newsArticle.webTitle + '</h2>');
        $("#team-news-content").append(articleLabel);
        var readMore = $('<div><a href=' + newsArticle.webUrl + ' target="_blank">Read More...</a></div>')
        $("#team-news-content").append(readMore);
        return false;
      }
    });
  });

  if (articleLabel === undefined) {
    articleLabel = $('<h2 class="ui sub header">No News</h2>');
    $("#team-news-content").append(articleLabel);
  }

}

/**
 * Helper function that gets team three letter code given API team ID
 */
function getTeamCode(teamId) {
  var teamCode;
  $.each(teams, function(index, team) {
    if (team.short_name === teamId) {
      teamCode = team.code;
      return false;
    }
  });

  return teamCode;
}

/**
 * Helper function that gets team name given API team ID
 */
function getTeamName(teamId) {
  var teamName;
  $.each(teams, function(index, team) {
    if (team.short_name === teamId) {
      teamName = team.name;
      return false;
    }
  });

  return teamName;
}

function getTeamId(teamName) {
  var teamId;
  $.each(teams, function(index, team) {
    if (team.name === teamName) {
      teamId = team.short_name;
      return false;
    }
  });

  return teamId;
}

/**
 * Get team's top goal scorer
 */
function getTopScorer(teamId) {
  var teamCode = getTeamCode(teamId);
  var topScorer = [[], -1];
  $.each(eplData, function(index, player) {
    if (player.team_code === teamCode) {
      if (player.goals_scored > topScorer[1]) {
        topScorer[0] = [];
        topScorer[0].push(player.first_name + " " + player.second_name);
        topScorer[1] = player.goals_scored;
      } else if (player.goals_scored === topScorer[1]) {
        topScorer[0].push(player.first_name + " " + player.second_name);
      }
    }
  });

  return topScorer;
}

/**
 * Get team's clean sheets
 */
function getCleanSheets(teamId) {
  var teamCode = getTeamCode(teamId);
  var cleanSheets = 0;
  $.each(eplData, function(index, player) {
    if (player.team_code === teamCode && player.element_type === 1) {
      cleanSheets += player.clean_sheets;
    }
  });

  return cleanSheets;
}

function setTeamsTag() {
  $.each(teams, function(index, team) {
    if (team.short_name === "ARS") {
      team.tag = ["Arsenal", "Gunners"];
    } else if (team.short_name === "BOU") {
      team.tag = ["Bournemouth", "Cherries"];
    } else if (team.short_name === "BUR") {
      team.tag = ["Burnley", "Clarets"];
    } else if (team.short_name === "CHE") {
      team.tag = ["Chelsea", "Blues"];
    } else if (team.short_name === "CRY") {
      team.tag = ["Palace", "Eagles"];
    } else if (team.short_name === "EVE") {
      team.tag = ["Everton", "Toffees"];
    } else if (team.short_name === "HUL") {
      team.tag = ["Hull", "Tigers"];
    } else if (team.short_name === "LEI") {
      team.tag = ["Leicester", "Foxes"];
    } else if (team.short_name === "LIV") {
      team.tag = ["Liverpool", "Reds"];
    } else if (team.short_name === "MCI") {
      team.tag = ["Manchester City", "Citizens"];
    } else if (team.short_name === "MUN") {
      team.tag = ["Manchester United", "United", "Red Devils"];
    } else if (team.short_name === "MID") {
      team.tag = ["Middlesbrough", "Boro"];
    } else if (team.short_name === "SOU") {
      team.tag = ["Southampton", "Saints"];
    } else if (team.short_name === "STK") {
      team.tag = ["Stoke", "Potters"];
    } else if (team.short_name === "SUN") {
      team.tag = ["Sunderland", "Black Cats"];
    } else if (team.short_name === "SWA") {
      team.tag = ["Swansea", "Swans"];
    } else if (team.short_name === "TOT") {
      team.tag = ["Tottenham", "Spurs"];
    } else if (team.short_name === "WAT") {
      team.tag = ["Watford", "Hornets"];
    } else if (team.short_name === "WBA") {
      team.tag = ["West Bromwich", "West Brom", "Albion", "Baggies"];
    } else if (team.short_name === "WHU") {
      team.tag = ["West Ham", "Irons"];
    }
  });
}

function getTeamTags(teamId) {
  var tags;
  $.each(teams, function(index, team) {
    if (team.short_name === teamId) {
      tags = team.tag;
      return false;
    }
  });

  return tags;
}
