import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import {AuthServiceProvider, User} from '../../../services/user/auth.service';
import { ProfileService } from '../../../services/user/profile.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import { AnalyticsService, Analytics, Sessions  } from 'src/app/services/analyticsService.service';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: User = {
      code: '',
      username: '',
      email:  '',
      password: '',
      dueDate: '',
      location: 0,
      cohort: '',
      bio:  '',
      securityQ: '',
      securityA: '',
      currentEmotion: '',
      profilePic: '',
      joined: '',
      daysAUser: 0
  };


  analytic: Analytics =
  {
    page: '',
    userID: '',
    timestamp: '',
    sessionID: ''
  }



  session : Sessions =
      {
          userID: '',
          LogOutTime: '',
          LoginTime: '',
          numOfClickChat: 0,
          numOfClickCalendar: 0,
          numOfClickLModule: 0,
          numOfClickInfo: 0,
          numOfClickSurvey: 0,
          numOfClickProfile: 0
      }

  private userProfileID: any;
  private analyticss : string;
  private sessions : Observable<any>;

  constructor(
      private alertCtrl: AlertController,
      private authService: AuthServiceProvider,
      private profileService: ProfileService,
      private router: Router,
      private activatedRoute: ActivatedRoute,
      private afs: AngularFirestore,
      private storage: Storage,
      private analyticsService: AnalyticsService
  ) {}

  ngOnInit() {
      this.storage.get('authenticated').then((val) => {
          if (val === 'false') {
              this.router.navigate(['/login/']);
          }
      });
    // this.refreshUserProfile();
  }

  ionViewWillEnter() {
      this.storage.get('userCode').then((val) => {
          if (val) {
              this.userProfileID = val;
              const ref = this.afs.firestore.collection('users').where('code', '==', val);
              ref.get().then((result) => {
                  result.forEach(doc => {
                      this.user.username = doc.get('username');
                      this.user.email = doc.get('email');
                      this.user.password = doc.get('password');
                      this.user.bio = doc.get('bio');
                      this.user.location = doc.get('location');
                      this.user.cohort = doc.get('cohort');
                      this.user.currentEmotion = doc.get('mood');
                      this.user.profilePic = doc.get('profilePic');

                  });
              });
          }
      });
          this.addView();
  }

  updateLogOut(){
   this.analyticsService.updateLogOut(this.session);
   console.log('added LogOutTime');

  }

  updateProfileClicks()
  {
    this.analyticsService.updateProfileClicks(this.session);
    console.log("added profile click");

  }



  addView(){

  //this.analytic.sessionID = this.session.id;
  this.storage.get('userCode').then((val) =>{
    if (val) {
      const ref = this.afs.firestore.collection('users').where('code', '==', val);
      ref.get().then((result) =>{
        result.forEach(doc =>{
          this.analytic.page = 'profile';
          this.analytic.userID = val;
          this.analytic.timestamp = firebase.firestore.FieldValue.serverTimestamp();
          //this.analytic.sessionID = this.idReference;
          this.analyticsService.addView(this.analytic).then (() =>{
            console.log('successful added view: profile');

          }, err =>{
            console.log('unsucessful added view: profile');

          });
        });
      });
    }
  });
}

  logOut(): void {
    this.storage.set('authenticated', 'false');
    this.storage.remove('userCode');
    this.storage.remove('totalDaysPregnant');
    this.storage.remove('weeksPregnant');
    this.storage.remove('daysPregnant');
    this.router.navigateByUrl('login');
  }

  async updateEmail(): Promise<void> {
    const alert = await this.alertCtrl.create({
      inputs: [
        { type: 'text', name: 'newEmail', placeholder: 'Your new email' },
        { name: 'password', placeholder: 'Your password', type: 'password' },
      ],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Save',
          handler: data => {
            this.profileService
                .updateEmail(data.newEmail, data.password, this.userProfileID);
          },
        },
      ],
    });
    await alert.present();
  }

  async updatePassword(): Promise<void> {
    const alert = await this.alertCtrl.create({
      inputs: [
        { name: 'newPassword', placeholder: 'New password', type: 'password' },
        { name: 'oldPassword', placeholder: 'Old password', type: 'password' },
      ],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Save',
          handler: data => {
            this.profileService.updatePassword(
                data.newPassword,
                data.oldPassword, this.userProfileID
            );
          },
        },
      ],
    });
    await alert.present();
  }

    async updateLocation(): Promise<void> {
        const alert = await this.alertCtrl.create({
            inputs: [
                { type: 'text', name: 'newLocation', placeholder: 'Your new location' },
            ],
            buttons: [
                { text: 'Cancel' },
                {
                    text: 'Save',
                    handler: data => {
                        this.profileService.updateLocation(
                            data.newLocation, this.userProfileID
                        );
                    },
                },
            ],
        });
        await alert.present();
    }

    async updateBio(): Promise<void> {
        const alert = await this.alertCtrl.create({
            inputs: [
                { type: 'text', name: 'newBio', placeholder: 'Your new bio' },
            ],
            buttons: [
                { text: 'Cancel' },
                {
                    text: 'Save',
                    handler: data => {
                        this.profileService.updateBio(
                            data.newBio, this.userProfileID
                        );
                    },
                },
            ],
        });
        await alert.present();
    }

  /*refreshUserProfile() {
    this.profileService
        .this.userProfileID
        .get()
        .then(userProfileSnapshot => {
          this.userProfileID = userProfileSnapshot.data();
        });
  }*/

  goHome() {
    this.router.navigate(['/tabs/home/', this.userProfileID ]);
  }


}
