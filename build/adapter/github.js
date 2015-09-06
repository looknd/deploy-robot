// Generated by CoffeeScript 1.7.1
(function() {
  var Github, GithubApi,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  GithubApi = require('github');

  Github = (function() {
    function Github(config) {
      var key, repo, _i, _len, _ref;
      this.config = config;
      this.github = new GithubApi({
        version: '3.0.0',
        timeout: 3000
      });
      this.github.authenticate({
        username: this.config.username,
        password: this.config.password,
        type: 'basic'
      });
      this.repos = {};
      _ref = this.config.repos;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        repo = _ref[_i];
        key = repo.user + '/' + repo.name;
        if (this.repos[key] == null) {
          this.repos[key] = [];
        }
        this.repos[key].push(repo);
      }
    }

    Github.prototype.scheduler = function(cb) {
      var k, name, repos, user, _i, _len, _ref, _ref1, _results;
      _ref = this.repos;
      _results = [];
      for (repos = _i = 0, _len = _ref.length; _i < _len; repos = ++_i) {
        k = _ref[repos];
        _ref1 = k.split('/'), user = _ref1[0], name = _ref1[1];
        _results.push((function(_this) {
          return function(user, name, repos) {
            var data, hash, repo, _j, _len1;
            data = {};
            hash = {};
            for (_j = 0, _len1 = repos.length; _j < _len1; _j++) {
              repo = repos[_j];
              data[repo.labels] = [];
              hash[repo.labels] = repo;
            }
            return _this.github.issues.repoIssues({
              user: user,
              repo: name,
              state: 'open',
              assignee: 'none'
            }, function(err, issues) {
              var issue, items, label, labels, _k, _l, _len2, _len3, _ref2, _results1;
              if (err != null) {
                throw err;
              }
              if (issues.length === 0) {
                return;
              }
              for (_k = 0, _len2 = issues.length; _k < _len2; _k++) {
                issue = issues[_k];
                for (labels in data) {
                  items = data[labels];
                  labels = ',' + labels + ',';
                  _ref2 = issue.labels;
                  for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
                    label = _ref2[_l];
                    if ((labels.indexOf(',' + label.name + ',')) >= 0) {
                      items.push(issue);
                      break;
                    }
                  }
                }
              }
              _results1 = [];
              for (labels in data) {
                items = data[labels];
                if (items.length > 0) {
                  _results1.push(cb(items, hash[labels]));
                } else {
                  _results1.push(void 0);
                }
              }
              return _results1;
            });
          };
        })(this)(user, name, repos));
      }
      return _results;
    };

    Github.prototype.makeId = function(repo, issue) {
      return "/" + repo.user + "/" + repo.name + "/issues/" + issue.number;
    };

    Github.prototype.selfAssign = function(repo, issue) {
      return this.github.issues.edit({
        user: repo.user,
        repo: repo.name,
        number: issue.number,
        assignee: this.config.username
      });
    };

    Github.prototype.finish = function(repo, issue, content, close) {
      return this.comment(repo, issue, content, (function(_this) {
        return function() {
          if (close) {
            return _this.github.issues.edit({
              user: repo.user,
              repo: repo.name,
              number: issue.number,
              assignee: null,
              state: 'closed'
            });
          }
        };
      })(this));
    };

    Github.prototype.comment = function(repo, issue, content, cb) {
      return this.github.issues.createComment({
        user: repo.user,
        repo: repo.name,
        number: issue.number,
        body: content
      }, function(err, comment) {
        if (err != null) {
          throw err;
        }
        return cb(comment);
      });
    };

    Github.prototype.confirm = function(repo, issue, users, currentComment, confirmMatched, stopMatched, noneMatched) {
      return this.github.issues.getComments({
        user: repo.user,
        repo: repo.name,
        number: issue.number,
        per_page: 100
      }, function(err, comments) {
        var comment, _i, _len, _ref;
        if (err != null) {
          throw err;
        }
        for (_i = 0, _len = comments.length; _i < _len; _i++) {
          comment = comments[_i];
          if ((_ref = comment.user.login, __indexOf.call(users, _ref) >= 0) && comment.id > currentComment.id) {
            if (comment.body.match(/^\s*confirm/i)) {
              return confirmMatched(repo, issue);
            } else if (comment.body.match(/^\s*stop/i)) {
              return stopMatched(repo, issue, comment.user.login);
            }
          }
        }
        return noneMatched(repo, issue);
      });
    };

    return Github;

  })();

  module.exports = Github;

}).call(this);
