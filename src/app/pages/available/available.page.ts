import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FireService, Survey } from 'src/app/services/survey/fire.service';
import { Storage} from '@ionic/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';

// Today's date as a Javascript Date Object
const today = new Date();

@Component({
  selector: 'app-available',
  templateUrl: './available.page.html',
  styleUrls: ['./available.page.scss'],
})

export class AvailablePage implements OnInit {
  public surveys: Observable<Survey[]>;
  public userCode = '';
  public emotion = '';
  public daysAUser = '';
  public dueDate = '';
  public answeredSurveys = [];
  public completed = '';
  public userVisibility;

  constructor(private fs: FireService,
              private storage: Storage,
              private router: Router,
              public afs: AngularFirestore,
              private activatedRoute: ActivatedRoute,
  ) {
  }

  ngOnInit() {

    this.storage.get('authenticated').then((val) => {
      if (val === 'false') {
        this.router.navigate(['/login/']);
      }
    });
  }

  ionViewDidEnter() {

    // get all the surveys available
    this.surveys = this.fs.getSurveys();
    console.log(this.surveys);

    // obtain the user's code, emotion, days being a user, due date, and answered surveys
    this.storage.get('userCode').then((val) => {
      if (val) {
        const ref = this.afs.firestore.collection('users').where('code', '==', val);
        ref.get().then((result) => {
          result.forEach(doc => {
            this.userCode = val;
            this.emotion = doc.get('mood');
            this.daysAUser = doc.get('daysAUser');
            this.dueDate = doc.get('dueDate').split('-');
            this.answeredSurveys = doc.get('answeredSurveys');
            this.completed = doc.get('answeredSurveys');
            console.log(this.answeredSurveys);
          });
        });
      }
    });
  }


  // isDisplayed determines if the survey shows up for the user or not
  isDisplayed(survey: Survey) {
    if (survey.userVisibility !== undefined) {
      const daysArray = survey.daysTillRelease.split(',');
      console.log(daysArray);
      if (this.isCompleted(survey)) {
        let lastComplete;
        this.answeredSurveys.forEach(id => {
          if (id.split(':')[0] === survey.id) {
            lastComplete = id.split(':')[1];
          }
        });
      }
      return survey.userVisibility.includes(this.userCode);
    } else {
      return false;
    }
  }

  isCompleted(survey: Survey) {
    let complete = false;
    this.answeredSurveys.forEach(id => {
        if (id.split(':')[0] === survey.id) {
          complete = true;
        }
    });
    return complete;
  }

  answerSurvey(survey: Survey) {

    // declare submitData which will contain the necessary information of the survey
    // when submitting it
    let submitData;

    // if the survey type is not inactive, take the survey interval for the current
    // survey and assign it to submit data
    if (survey.type !== 'Inactive') {
        submitData = survey.id + ':' + this.daysAUser;
    }

    // since the inactive surveys are dealt with differently,
    // just add the survey id with a 0. This is because Inactive surveys
    // do not have intervals, and only need to be taken once if the user
    // has been inactive for a certain number of days
    // if (survey.type === 'Inactive') {
    //   submitData = survey.id + ':' + '0';
    // }

    // navigate to the answer page and pass the submitData
    this.router.navigate(['/tabs/home/available/answer/' + submitData]);
  }
}

    // array of days that will determine when the survey is displayed

    // let daysArray;
    //
    // // number of days before the Survey expires
    // let expirationDays;
    //
    // // boolean to determine if the survey can be displayed to the user
    // let canDisplay = false;
    //
    // // boolean to determine if a certain item is included in the answeredSurveys array
    // let includes = false;

    // date due of the current user
    // const dateDue = new Date(this.dueDate[1] + '/' + this.dueDate[2] + '/' + this.dueDate[0]);
    //
    // // time in milliseconds before the user's due date
    // const timeBeforeDue =  dateDue.getTime() - today.getTime();
    //
    // // time in days before the user's due date
    // const daysBeforeDue = Math.trunc( timeBeforeDue / (1000 * 3600 * 24) );
    //
    // // if the user is inside the survey's userVisibility array
    // if (survey.userVisibility.includes(this.userCode)) {
    //   return true;

      // if the survey type is after joining, show it to the user if their join date is between
      // a value of the daysArray and the expiration date, if the user's join date is not between
      // those dates or if they have already taken the survey for this interval then don't show
   //    if (survey.daysTillExpire === 0) {
   //      expirationDays = survey.daysTillExpire + 100000;
   //    }
   //
   //    if (survey.daysTillExpire !== 0) {
   //      expirationDays = survey.daysTillExpire;
   //    }
   //
   //    if (survey.type === 'After Joining') {
   //      daysArray = survey.daysTillRelease.split(/(?:,| )+/);
   //      daysArray.forEach(day => {
   //        if (this.daysAUser >= parseInt(day) && this.daysAUser <= parseInt(day) + expirationDays) {
   //          this.answeredSurveys.forEach( answered => {
   //            if (answered.split(':')[0] == survey.id && answered.split(':')[1] == day) {
   //              canDisplay = true;
   //              this.completed.push(survey.id);
   //              includes = true;
   //            }
   //
   //            if (answered.split(':')[0] == survey.id && answered.split(':')[1] != day) {
   //              canDisplay = true;
   //              includes = true;
   //              this.surveyInterval.push(survey.id + ':' + day);
   //            }
   //          });
   //
   //          if (!includes) {
   //            canDisplay = true;
   //            this.surveyInterval.push(survey.id + ':' + day);
   //          }
   //        }
   //      });
   //    }
   //
   //    // if the survey type is Due Date, show it to the user if their duedate is between
   //    // a value of the daysArray and the expiration date, if the user's join date is not between
   //    // those dates or if they have already taken the survey for this interval then don't show
   //    if (survey.type === 'Due Date') {
   //      daysArray = survey.daysBeforeDueDate.split(/(?:,| )+/);
   //      daysArray.forEach(day => {
   //        if (daysBeforeDue <= parseInt(day) && daysBeforeDue >= parseInt(day) - expirationDays) {
   //          this.answeredSurveys.forEach( answered => {
   //            if (answered.split(':')[0] == survey.id && answered.split(':')[1] == day) {
   //              canDisplay = true;
   //              this.completed.push(survey.id);
   //              includes = true;
   //            }
   //
   //            if (answered.split(':')[0] == survey.id && answered.split(':')[1] != day) {
   //              canDisplay = true;
   //              includes = true;
   //              this.surveyInterval.push(survey.id + ':' + day);
   //            }
   //          });
   //
   //          if (!includes) {
   //            canDisplay = true;
   //            this.surveyInterval.push(survey.id + ':' + day);
   //          }
   //        }
   //      });
   //    }
   //
   //    // if the survey type is inactive and the user's inactive days meets or exceeds the
   //    // surveys inactive days field, then display to the user
   //    if (survey.type === 'Inactive') {
   //      if (survey.daysInactive <= this.inactiveDays) {
   //        canDisplay = true;
   //      }
   //    }
   // }
   //
   //    // if the survey type is Emotion and the user's emotion matches the survey's
   //    // emotion field, then display to the user. Additional checks are in place
   //    // to make sure that the user doesn't take the same survey multiple times a day
   //    // Also emotion surveys do not have to have its userVisibility checked as notifications
   //    // for Emotion surveys send to the user very quickly
   //  if (survey.type === 'Emotion') {
   //      if (survey.emotionChosen === this.emotion) {
   //        canDisplay = true;
   //        this.answeredSurveys.forEach( answered => {
   //          if (answered.split(':')[0] === survey.id && answered.split(':')[1] === ('' + today.getDate())) {
   //            canDisplay = true;
   //            this.completed.push(survey.id);
   //            includes = true;
   //          }
   //          if (answered.split(':')[0] === survey.id && answered.split(':')[1] !== ('' + today.getDate())) {
   //            canDisplay = true;
   //            includes = true;
   //            this.surveyInterval.push(survey.id + ':' + today.getDate());
   //          }
   //        });
   //
   //        if (!includes) {
   //          canDisplay = true;
   //          this.surveyInterval.push(survey.id + ':' + today.getDate());
   //        }
   //      }
   //    }
   //
   // // return if the user can see the survey or not
   //  return canDisplay;
  // }

  // checks if the survey is complete by returning true if the survey
  // id is in the completed array
 //  isComplete(survey: Survey) {
 //    return this.completed.includes(survey.id);
 //  }
 //
 //  // determines if the passed Survey's ID matches the highlightedID, only
 //  // if the highlightedID exists otherwise returns false
 //  isHighlight(survey: Survey) {
 //    if (this.highlightID) {
 //      return this.highlightID === survey.id;
 //    }
 //
 //    return false;
 //  }
 //
 //  // whenever a survey card is clicked on the Survey Center, the data of the survey
 //  // needs to be processed and then passed to the answer page
 //  answerSurvey(survey: Survey) {
 //
 //    // declare submitData which will contain the necessary information of the survey
 //    // when submitting it
 //    let submitData;
 //
 //    // if the survey type is not inactive, take the survey interval for the current
 //    // survey and assign it to submit data
 //    if (survey.type !== 'Inactive') {
 //      this.surveyInterval.forEach( surv => {
 //        if (surv.split(':')[0] === survey.id) {
 //          submitData = surv;
 //        }
 //      });
 //    }
 //
 //    // if the survey has been completed, mark it as so
 //    if (this.isComplete(survey)) {
 //      submitData = survey.id + ':' + 'completed';
 //    }
 //
 //    // since the inactive surveys are dealt with differently,
 //    // just add the survey id with a 0. This is because Inactive surveys
 //    // do not have intervals, and only need to be taken once if the user
 //    // has been inactive for a certain number of days
 //    if (survey.type === 'Inactive') {
 //      submitData = survey.id + ':' + '0';
 //    }
 //
 //    // navigate to the answer page and pass the submitData
 //    this.router.navigate(['/tabs/home/available/answer/' + submitData]);
 //  }
 // }
