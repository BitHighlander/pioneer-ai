"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.IndexController = exports.ApiError = void 0;
/*

    REST endpoints

 */
var TAG = ' | API | ';
var pjson = require('../../package.json');
var log = require('@bithighlander/loggerdog-client')();
var _a = require('@pioneer-platform/default-redis'), subscriber = _a.subscriber, publisher = _a.publisher, redis = _a.redis;
var connection = require("@pioneer-platform/default-mongo");
var knowledgeDB = connection.get('knowledge');
var tasksDB = connection.get('tasks');
var rivescriptDB = connection.get('rivescriptRaw');
var skillsDB = connection.get('skills');
var credentialsDB = connection.get('credentials');
//rest-ts
var tsoa_1 = require("tsoa");
var ApiError = /** @class */ (function (_super) {
    __extends(ApiError, _super);
    function ApiError(name, statusCode, message) {
        var _this = _super.call(this, message) || this;
        _this.name = name;
        _this.statusCode = statusCode;
        return _this;
    }
    return ApiError;
}(Error));
exports.ApiError = ApiError;
//route
var IndexController = /** @class */ (function (_super) {
    __extends(IndexController, _super);
    function IndexController() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /*
        Health endpoint


    */
    IndexController.prototype.health = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tag, status_1, output, e_1, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | health | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, redis.hgetall("info:health")];
                    case 2:
                        status_1 = _a.sent();
                        output = {
                            online: true,
                            name: pjson.name,
                            version: pjson.version,
                            system: status_1
                        };
                        return [2 /*return*/, (output)];
                    case 3:
                        e_1 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_1
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_1.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*
        Get user by address

     */
    IndexController.prototype.user = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, status_2, e_2, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | user | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, redis.hgetall("info:health")];
                    case 2:
                        status_2 = _a.sent();
                        return [2 /*return*/, (true)];
                    case 3:
                        e_2 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_2
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_2.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*
        CRUD on skills
     */
    IndexController.prototype.skills = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tag, status_3, e_3, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | user | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, skillsDB.find()];
                    case 2:
                        status_3 = _a.sent();
                        return [2 /*return*/, (status_3)];
                    case 3:
                        e_3 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_3
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_3.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Create a skill
    IndexController.prototype.createSkill = function (skill) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, createdSkill, e_4, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | createSkill | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, skillsDB.create(skill)];
                    case 2:
                        createdSkill = _a.sent();
                        return [2 /*return*/, createdSkill];
                    case 3:
                        e_4 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_4
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_4.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Update a skill
    IndexController.prototype.updateSkill = function (id, skill) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, updatedSkill, e_5, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | updateSkill | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, skillsDB.update({ _id: id }, skill)];
                    case 2:
                        updatedSkill = _a.sent();
                        return [2 /*return*/, updatedSkill];
                    case 3:
                        e_5 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_5
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_5.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Delete a skill
    IndexController.prototype.deleteSkill = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var tag, deletedSkill, e_6, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | deleteSkill | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, skillsDB.remove({ _id: id })];
                    case 2:
                        deletedSkill = _a.sent();
                        return [2 /*return*/, deletedSkill];
                    case 3:
                        e_6 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_6
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_6.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*
        Get Tasks
     */
    IndexController.prototype.tasks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tag, status_4, e_7, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | user | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, tasksDB.find()];
                    case 2:
                        status_4 = _a.sent();
                        return [2 /*return*/, (status_4)];
                    case 3:
                        e_7 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_7
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_7.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*
        Get Solutions
     */
    IndexController.prototype.solutions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tag, status_5, e_8, errorResp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tag = TAG + " | user | ";
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, knowledgeDB.find()];
                    case 2:
                        status_5 = _a.sent();
                        return [2 /*return*/, (status_5)];
                    case 3:
                        e_8 = _a.sent();
                        errorResp = {
                            success: false,
                            tag: tag,
                            e: e_8
                        };
                        log.error(tag, "e: ", { errorResp: errorResp });
                        throw new ApiError("error", 503, "error: " + e_8.toString());
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    __decorate([
        (0, tsoa_1.Get)('/health')
    ], IndexController.prototype, "health");
    __decorate([
        (0, tsoa_1.Get)('/user/address/{address}')
    ], IndexController.prototype, "user");
    __decorate([
        (0, tsoa_1.Get)('/skills')
    ], IndexController.prototype, "skills");
    __decorate([
        (0, tsoa_1.Post)('/skills'),
        __param(0, (0, tsoa_1.Body)())
    ], IndexController.prototype, "createSkill");
    __decorate([
        (0, tsoa_1.Post)('/skills/:id'),
        __param(1, (0, tsoa_1.Body)())
    ], IndexController.prototype, "updateSkill");
    __decorate([
        (0, tsoa_1.Post)('/skills/:id/delete')
    ], IndexController.prototype, "deleteSkill");
    __decorate([
        (0, tsoa_1.Get)('/tasks')
    ], IndexController.prototype, "tasks");
    __decorate([
        (0, tsoa_1.Get)('/solutions')
    ], IndexController.prototype, "solutions");
    IndexController = __decorate([
        (0, tsoa_1.Route)('')
    ], IndexController);
    return IndexController;
}(tsoa_1.Controller));
exports.IndexController = IndexController;
