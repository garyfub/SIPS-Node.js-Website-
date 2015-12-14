var qs = require('qs');
//Model for Forms
module.exports = {
    //TODO: Collect data in per-line basis, add sql prep and execute commands in for loop
    sportsFormEntry: function (req) {
        var data = req.body;

        //Original form data from POST
       console.log(data);

        //Parse data to Object type
        var question = qs.parse(data);
/*
        console.log('Question 1: ' + question.q1 + '\nQuestion 2: ' + question.q2);
        console.log('Question 3: ' + question.q3 + '\nQuestion 4: ' + question.q4);
        console.log('Question 5: ' + question.q5 + '\nQuestion 6: ' + question.q6);
        console.log('Question 7: ' + question.q7 + '\nQuestion 8: ' + question.q8);
        console.log('Question 9: ' + question.q9 + '\nQuestion 10: ' + question.q10);
        console.log('Question 11: ' + question.q11 + '\nQuestion 12: ' + question.q12);
        console.log('Question 13: ' + question.q13);
*/

        var empty = 0;
        for(var i = 1; i > -1; i++){
            if(question.arr[i]){
                console.log('Question ' + i + ': ' + question.arr[i]);

                //Check if Custom entry exists
                if (question.arr_1[i]) {
                    empty = 0;
                    console.log('Question ' + i + '_1: ' + question.arr_1[i]);
                }
            }
            else if (empty == 20){
                break; //exit if no more values after 20 iterations
            }
            else{
                empty++;
            }
        }
    }
};

